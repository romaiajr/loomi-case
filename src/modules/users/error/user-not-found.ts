export class UserNotFoundError extends Error {
  constructor() {
    super(UserNotFoundError.name);
    this.message = 'Usuário não encontrado';
  }
}
