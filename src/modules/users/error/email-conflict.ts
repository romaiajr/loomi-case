export class EmailConflictError extends Error {
  constructor() {
    super(EmailConflictError.name);
    this.message = 'Email já cadastrado';
  }
}
