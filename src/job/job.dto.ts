import { IsUUID, IsDate, IsString, IsNotEmpty } from 'class-validator';

export class JobDto {
    @IsString()
    task!: string;

    @IsString()
    targetUrl!: string;

    @IsDate()
    runAt!: Date

    @IsNotEmpty()
    payload: any
}
