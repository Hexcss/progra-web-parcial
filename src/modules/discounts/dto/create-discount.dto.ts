import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsMongoId, IsNumber, Max, Min } from 'class-validator';

export class CreateDiscountDto {
    @ApiProperty({ type: String })
    @IsMongoId()
    productId!: string;

    @ApiProperty({ example: 15 })
    @IsNumber()
    @Min(0)
    @Max(100)
    discountPercent!: number;

    @ApiProperty()
    @IsDateString()
    startDate!: string;

    @ApiProperty()
    @IsDateString()
    endDate!: string;
}
