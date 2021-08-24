export default termsole;
interface Options {
  host?: string;
  port?: number;
  ssl?: boolean;
}
declare function termsole(options: Options = {}): void;
