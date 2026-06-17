import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class DeleteAccountDto {
  @IsIn(['account', 'mentor', 'mentee'], {
    message: 'This field only accepts: "account", "mentor" or "mentee"',
  })
  @IsNotEmpty()
  @IsString({ message: 'Only strings are allowed in this field' })
  target: string;
}
