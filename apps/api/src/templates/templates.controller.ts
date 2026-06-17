import { Body, Controller, Delete, Get, HttpCode, Param, Post } from '@nestjs/common';
import type { Template } from '@prisma/client';
import { TemplatesService } from './templates.service';
import { CreateTemplateDto } from './dto/create-template.dto';

@Controller('templates')
export class TemplatesController {
  constructor(private readonly templates: TemplatesService) {}

  @Post()
  async create(@Body() dto: CreateTemplateDto): Promise<Template> {
    return this.templates.create(dto);
  }

  @Get()
  async findAll(): Promise<Template[]> {
    return this.templates.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Template> {
    return this.templates.findOne(id);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string): Promise<void> {
    return this.templates.delete(id);
  }
}
