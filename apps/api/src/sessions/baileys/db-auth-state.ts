import pino from 'pino';
import {
  initAuthCreds,
  BufferJSON,
  makeCacheableSignalKeyStore,
  type AuthenticationCreds,
  type AuthenticationState,
  type SignalDataTypeMap,
  type SignalKeyStore,
} from '@whiskeysockets/baileys';
import { type Prisma } from '@prisma/client';
import { type PrismaService } from '../../common/prisma/prisma.service';
import { encrypt, decrypt } from './auth-cipher';

interface StoredState {
  creds: string;
  keys: Record<string, Record<string, string>>;
}

export interface DbAuthStateResult {
  state: AuthenticationState;
  saveCreds: () => Promise<void>;
}

export async function makeDbAuthState(
  prisma: PrismaService,
  sessionId: string,
  encKey: Buffer,
): Promise<DbAuthStateResult> {
  const session = await prisma.session.findUnique({ where: { id: sessionId } });
  const stored = (session?.authState ?? null) as StoredState | null;

  let creds: AuthenticationCreds;
  if (stored?.creds) {
    try {
      creds = JSON.parse(decrypt(stored.creds, encKey), BufferJSON.reviver) as AuthenticationCreds;
    } catch {
      creds = initAuthCreds();
    }
  } else {
    creds = initAuthCreds();
  }

  const keys: Record<string, Record<string, string>> = stored?.keys ?? {};

  const saveToDb = async (): Promise<void> => {
    const state: StoredState = {
      creds: encrypt(JSON.stringify(creds, BufferJSON.replacer), encKey),
      keys,
    };
    await prisma.session.update({
      where: { id: sessionId },
      data: { authState: state as unknown as Prisma.InputJsonValue },
    });
  };

  const backingStore: SignalKeyStore = {
    get: async <T extends keyof SignalDataTypeMap>(
      type: T,
      ids: string[],
    ): Promise<{ [id: string]: SignalDataTypeMap[T] }> => {
      const result: { [id: string]: SignalDataTypeMap[T] } = {};
      const typeStr = type as unknown as string;
      const typeKeys = keys[typeStr] ?? {};
      for (const id of ids) {
        const enc = typeKeys[id];
        if (enc) {
          try {
            result[id] = JSON.parse(decrypt(enc, encKey), BufferJSON.reviver) as SignalDataTypeMap[T];
          } catch {
            // skip corrupted key
          }
        }
      }
      return result;
    },

    set: async (data): Promise<void> => {
      const rawData = data as unknown as Record<string, Record<string, unknown> | undefined>;
      for (const [type, typeData] of Object.entries(rawData)) {
        if (!typeData) continue;
        if (!keys[type]) keys[type] = {};
        for (const [id, value] of Object.entries(typeData)) {
          if (value != null) {
            keys[type][id] = encrypt(JSON.stringify(value, BufferJSON.replacer), encKey);
          } else {
            delete keys[type][id];
          }
        }
      }
      await saveToDb();
    },
  };

  const silentLogger = pino({ level: 'silent' });

  return {
    state: {
      creds,
      keys: makeCacheableSignalKeyStore(backingStore, silentLogger),
    },
    saveCreds: saveToDb,
  };
}
