import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { TrademarksService } from './trademarks.service';
import { updateTrademarkDTO } from './dto/trademark.dto';
import { Trademark } from '@prisma/client';
import { ProductsService } from '../products/products.service';

@Controller('trademarks')
export class TrademarksController {
  constructor(
    private trademarksService: TrademarksService,
    private productsService: ProductsService,
  ) {}

  @Get()
  getTrademarks(@Query('name') name: string) {
    return this.trademarksService.getTrademarks(name);
  }

  @Get(':id')
  async getTrademarkById(@Param('id') rawId: number) {
    const id = Number(rawId);
    if (isNaN(id)) throw new BadRequestException('Id must be a number.');

    const trademark = await this.trademarksService.getTrademarkById(id);
    if (!trademark) throw new NotFoundException('Trademark does not exist.');
    return trademark;
  }

  @Post()
  createTrademark(@Body() data: Trademark) {
    return this.trademarksService.createTrademark(data);
  }

  @Patch(':id')
  async updateTrademark(
    @Param('id') rawId: string,
    @Body() data: updateTrademarkDTO,
  ) {
    const id = Number(rawId);
    if (isNaN(id)) throw new BadRequestException('Id must be a number.');

    try {
      return await this.trademarksService.updateTrademark(id, data);
    } catch (error) {
      throw new NotFoundException('Trademark does not exist.');
    }
  }

  @Delete(':id')
  async deleteTrademark(@Param('id') rawId: string) {
    const id = Number(rawId);
    if (isNaN(id)) throw new BadRequestException('Id must be a number.');

    const trademarkProducts =
      await this.productsService.getProductsByTrademark(id);

    if (trademarkProducts.length) {
      throw new ConflictException(
        'Can not delete trademark when a product is associated with it.',
      );
    }

    try {
      return await this.trademarksService.deleteTrademark(id);
    } catch (error) {
      throw new NotFoundException('Trademark does not exist.');
    }
  }
}
