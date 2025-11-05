// src/modules/products/dto/create-product.dto.ts
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({
    description: 'Name of the product',
    example: 'Wireless Headphones',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({
    description: 'Detailed description of the product',
    example: 'Noise-cancelling over-ear Bluetooth headphones.',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Price of the product (must be non-negative)',
    example: 129.99,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  price!: number;

  @ApiProperty({
    description: 'Stock quantity available',
    example: 50,
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  stock!: number;

  @ApiPropertyOptional({
    description: 'Image URL of the product',
    example: 'https://cdn.example.com/images/headphones.jpg',
  })
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiPropertyOptional({
    description: 'Category of the product',
    example: 'Electronics',
  })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({
    description: 'List of tags for filtering or search',
    example: ['wireless', 'audio', 'bluetooth'],
    type: [String],
  })
  @IsArray()
  @IsOptional()
  tags?: string[];
}
