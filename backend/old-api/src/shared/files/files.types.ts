import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class UploadedFile {
  @Field()
  url!: string;

  @Field()
  key!: string;

  @Field()
  filename!: string;

  @Field(() => Int)
  size!: number;

  @Field()
  mimeType!: string;
}
