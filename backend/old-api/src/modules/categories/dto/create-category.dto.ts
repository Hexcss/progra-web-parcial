import { Field, InputType } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

@InputType()
export class CreateCategoryDto {
    @Field()
    @ApiProperty({ example: 'Laptops' })
    @IsString()
    @IsNotEmpty()
    name!: string;

    @Field()
    @ApiProperty({ example: 'laptop' })
    @IsString()
    @IsNotEmpty()
    icon!: string;
}
