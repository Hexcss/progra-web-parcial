import { Field, ObjectType } from '@nestjs/graphql';
import { Role } from '../enums/role.enum';

@ObjectType()
export class DeleteResponse {
  @Field()
  success!: boolean;
}

@ObjectType()
export class EmailStatus {
  @Field()
  attempted!: boolean;

  @Field()
  sent!: boolean;

  @Field(() => String, { nullable: true })
  id!: string | null;

  @Field(() => String, { nullable: true })
  error!: string | null;
}

@ObjectType()
export class SessionPayload {
  @Field()
  sub!: string;

  @Field()
  email!: string;

  @Field(() => Role)
  role!: Role;
}

@ObjectType()
export class CategoryThumbnail {
  @Field()
  categoryId!: string;

  @Field(() => String, { nullable: true })
  thumbnail?: string | null;
}

@ObjectType()
export class FilenameResponse {
  @Field()
  filename!: string;
}
