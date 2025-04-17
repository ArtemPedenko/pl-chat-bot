import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class MessageDto {
  @ApiProperty({ example: 'Дайте телефон водителя' })
  @IsString({ message: 'Должно быть строкой' })
  @IsNotEmpty({ message: 'Не должно быть пустым' })
  message: string;

  @ApiProperty({
    example: 112312,
    description: 'ID пользователя. Может быть строкой или числом',
  })
  @Transform(({ value }) => (value ? String(value) : undefined))
  @IsString()
  @IsNotEmpty({ message: 'Не должно быть пустым' })
  id: string;
}

export class MessageResponseDto {
  @ApiProperty({ example: 'Телефон водителя будет указан....' })
  message: string;

  @ApiProperty({ example: 'thread_xVNuYafWNiVh5ThaTXZTGrCG' })
  threadId: string;
}
