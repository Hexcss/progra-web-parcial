// src/modules/products/dto/create-product.dto.ts
import { Field, Float, ID, InputType, Int } from '@nestjs/graphql';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsInt, IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

@InputType()
export class CreateProductDto {
  @Field()
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name!: string;

  @Field(() => String, { nullable: true })
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @Field(() => Float)
  @ApiProperty({ minimum: 0 })
  @IsNumber()
  @Min(0)
  price!: number;

  @Field(() => Int)
  @ApiProperty({ minimum: 0 })
  @IsInt()
  @Min(0)
  stock!: number;

  @Field(() => String, { nullable: true })
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @Field(() => String, { nullable: true })
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  category?: string;

  @Field(() => ID, { nullable: true })
  @ApiPropertyOptional({ type: String })
  @IsMongoId()
  @IsOptional()
  categoryId?: string;

  @Field(() => [String], { nullable: true })
  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsOptional()
  tags?: string[];
}
