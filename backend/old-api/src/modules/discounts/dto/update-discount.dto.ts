import { InputType, PartialType } from '@nestjs/graphql';
import { CreateDiscountDto } from './create-discount.dto';

@InputType()
export class UpdateDiscountDto extends PartialType(CreateDiscountDto) {}
