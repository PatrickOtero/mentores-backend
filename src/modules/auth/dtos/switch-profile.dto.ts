import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class SwitchProfileDto {
  @IsIn(['mentor', 'user', 'mentee'], {
    message: 'This field only accepts: "mentor", "user" or "mentee"',
  })
  @IsNotEmpty()
  @IsString({ message: 'Only strings are allowed in this field' })
  type: string;
}
