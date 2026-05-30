import { Field, GraphQLISODateTime, ObjectType, Query, Resolver } from '@nestjs/graphql';
import { Public } from 'src/common/decorators/public.decorator';

@ObjectType()
class HealthStatus {
  @Field()
  ok!: boolean;

  @Field(() => GraphQLISODateTime)
  ts!: Date;
}

@Resolver()
export class HealthResolver {
  @Public()
  @Query(() => HealthStatus)
  health() {
    return { ok: true, ts: new Date() };
  }
}
