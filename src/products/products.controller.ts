import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { Product } from '@prisma/client';
import { productDTO } from './dto/product.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { diskStorage } from 'multer';
import { TrademarksService } from 'src/trademarks/trademarks.service';
import { CategoriesService } from 'src/categories/categories.service';

@Controller('products')
export class ProductsController {
  constructor(
    private productsService: ProductsService,
    private trademarksService: TrademarksService,
    private categoriesService: CategoriesService,
  ) {}

  @Get()
  getProducts(): Promise<Product[]> {
    return this.productsService.getProducts();
  }

  @Get(':id')
  async getProductById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Product> {
    const product = await this.productsService.getProductById(id);
    if (!product) throw new NotFoundException("Product doesn't exist");
    return product;
  }

  @Post()
  async createProduct(@Body() data: productDTO): Promise<Product> {
    const categories = await this.categoriesService.getCategoriesId();
    const categoryExists = categories.some((category) => {
      return category.id === data.category_id;
    });

    if (!categoryExists)
      throw new BadRequestException('Seleccione una categoría existente.');

    const trademarks = await this.trademarksService.getTrademarksId();
    const trademarkExists = trademarks.some((trademark) => {
      return trademark.id === data.trademark_id;
    });

    if (!trademarkExists)
      throw new BadRequestException('Seleccione una marca existente.');

    return this.productsService.createProduct(data);
  }

  @Post('images')
  @UseInterceptors(
    FileInterceptor('images', {
      storage: diskStorage({
        destination: './public/',
        filename: async (req, file, cb) => {
          //? Validate if public directory exists
          const imageFolder = './public';
          if (!existsSync(imageFolder)) {
            await mkdir(imageFolder);
          }

          // create image name
          const time = new Date().getTime();
          const ext = file.originalname.slice(file.originalname.indexOf('.'));
          const imageName = time + ext;

          return cb(null, imageName);
        },
      }),
      limits: {
        fileSize: 1000000,
      },
    }),
  )
  async saveProductImage(
    @UploadedFile() images: Express.Multer.File,
  ): Promise<string> {
    return `/${images.filename}`;
  }

  @Patch(':id')
  async updateProduct(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: productDTO,
  ): Promise<Product> {
    const categories = await this.categoriesService.getCategoriesId();
    const categoryExists = categories.some((category) => {
      return category.id === data.category_id;
    });

    if (!categoryExists)
      throw new BadRequestException('Seleccione una categoría existente.');

    const trademarks = await this.trademarksService.getTrademarksId();
    const trademarkExists = trademarks.some((trademark) => {
      return trademark.id === data.trademark_id;
    });

    if (!trademarkExists)
      throw new BadRequestException('Seleccione una marca existente.');

    // Update completed validation
    const product = this.productsService.updateProduct(id, data);
    if (!product) {
      throw new NotFoundException('Product does not exist.');
    }

    return product;
  }

  @Delete(':id')
  async deleteProduct(@Param('id', ParseIntPipe) id: number): Promise<Product> {
    try {
      return await this.productsService.deleteProduct(id);
    } catch (error) {
      throw new NotFoundException('Product does not exist.');
    }
  }
}
