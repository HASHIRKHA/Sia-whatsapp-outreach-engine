import createHttpsProxyAgent from 'https-proxy-agent';
import { SocksProxyAgent } from 'socks-proxy-agent';
import { buildFetchAgent } from './build-fetch-agent';
import type { ProxyConfig } from '../../antiban/proxy.service';

const { HttpsProxyAgent } = createHttpsProxyAgent;

const httpProxy: ProxyConfig = { host: '1.2.3.4', port: 8080, protocol: 'http' };
const httpsProxy: ProxyConfig = { ...httpProxy, protocol: 'https' };
const socks5Proxy: ProxyConfig = { ...httpProxy, protocol: 'socks5' };
const authProxy: ProxyConfig = { ...httpProxy, username: 'usr', password: 'p@ss' };

describe('buildFetchAgent', () => {
  it('returns undefined when proxy is null', () => {
    expect(buildFetchAgent(null)).toBeUndefined();
  });

  it('returns an HttpsProxyAgent for http protocol', () => {
    const agent = buildFetchAgent(httpProxy);
    expect(agent).toBeInstanceOf(HttpsProxyAgent);
  });

  it('returns an HttpsProxyAgent for https protocol', () => {
    const agent = buildFetchAgent(httpsProxy);
    expect(agent).toBeInstanceOf(HttpsProxyAgent);
  });

  it('returns a SocksProxyAgent for socks5 protocol', () => {
    const agent = buildFetchAgent(socks5Proxy);
    expect(agent).toBeInstanceOf(SocksProxyAgent);
  });

  it('returns a defined agent even without credentials', () => {
    expect(buildFetchAgent(httpProxy)).toBeDefined();
  });

  it('returns a defined agent when credentials are supplied', () => {
    expect(buildFetchAgent(authProxy)).toBeDefined();
  });
});
