import { createHash } from 'crypto';
import { userConfirmTokenData, userValidateTokenData } from '../models';

export function IsValidEmail (email: string): boolean {
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    return emailRegex.test(email);
}

export function GeneratePasswordHash (password: string): string {
    return createHash('sha256').update(password).digest('hex');
}

export function GenerateAuthConfirmToken (data: userConfirmTokenData) {

}

export function ValidateJWTToken (data: userValidateTokenData) {

}