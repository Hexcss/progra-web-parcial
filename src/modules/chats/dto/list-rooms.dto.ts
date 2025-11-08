// src/modules/chats/dto/list-rooms.dto.ts
import { IsIn, IsInt, IsOptional, Min } from 'class-validator';

export class ListRoomsDto {
    @IsOptional()
    @IsIn(['waiting', 'assigned', 'closed'])
    status?: 'waiting' | 'assigned' | 'closed';

    @IsOptional()
    @IsInt()
    @Min(1)
    page?: number;

    @IsOptional()
    @IsInt()
    @Min(1)
    limit?: number;
}
