import { Field, Float, ID, InputType } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsMongoId, IsNumber, Max, Min } from 'class-validator';

@InputType()
export class CreateDiscountDto {
    @Field(() => ID)
    @ApiProperty({ type: String })
    @IsMongoId()
    productId!: string;

    @Field(() => Float)
    @ApiProperty({ example: 15 })
    @IsNumber()
    @Min(0)
    @Max(100)
    discountPercent!: number;

    @Field(() => String)
    @ApiProperty()
    @IsDateString()
    startDate!: string;

    @Field(() => String)
    @ApiProperty()
    @IsDateString()
    endDate!: string;
}
