import { IsUUID, IsDate, IsString, IsNotEmpty, IsDateString } from 'class-validator';

export class JobDto {
    @IsString()
    task!: string;

    @IsString()
    targetUrl!: string;

    @IsDateString()
    runAt!: string;

    @IsNotEmpty()
    payload: any
}
