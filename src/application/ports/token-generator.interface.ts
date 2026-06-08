export interface ITokenGenerator {
  generate(sizeBytes?: number): string;
}
