import { applyDecorators } from '@nestjs/common';
import { ApiCookieAuth } from '@nestjs/swagger';

export const ApiAuthCookies = () =>
	applyDecorators(
		ApiCookieAuth('accessToken'),
		ApiCookieAuth('refreshToken')
	);
