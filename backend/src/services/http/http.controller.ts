import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HttpService } from './http.service';
import {
  CreateServiceDto,
} from './http.entity';

@ApiTags('http')
@Controller('http')
export class HttpController {
  private readonly logger = new Logger(HttpController.name);

  constructor(private readonly httpService: HttpService) {}

  @Post()
  @ApiOperation({ summary: 'Cadastrar novo serviço HTTP' })
  @ApiResponse({ status: 201, description: 'Serviço HTTP criado com sucesso' })
  create(@Body() createHttpDto: CreateServiceDto) {
    return this.httpService.create(createHttpDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos os serviços HTTP' })
  findAll() {
    return this.httpService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter um serviço HTTP pelo ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.httpService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar configuração de um serviço HTTP' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateHttpDto: CreateServiceDto,
  ) {
    return this.httpService.update(id, updateHttpDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover serviço HTTP pelo ID' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.httpService.remove(id);
  }

  @Delete()
  @ApiOperation({ summary: 'Remover todos os serviços HTTP' })
  removeAll() {
    return this.httpService.removeAll();
  }
}
