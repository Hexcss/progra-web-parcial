// src/modules/orders/dto/create-order.dto.ts
import { Field, ID, InputType, Int } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ArrayMinSize, ValidateNested, IsInt, IsMongoId, Min, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

@InputType('CreateOrderItemInput')
export class CreateOrderItemDto {
  @Field(() => ID)
  @ApiProperty()
  @IsMongoId()
  productId!: string;

  @Field(() => Int)
  @ApiProperty()
  @IsInt()
  @Min(1)
  quantity!: number;
}

@InputType()
export class CreateOrderDto {
  @Field(() => [CreateOrderItemDto])
  @ApiProperty({ type: [CreateOrderItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];

  @Field(() => String, { nullable: true })
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  currency?: string;
}
