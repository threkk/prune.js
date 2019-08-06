export function zip(a: any[], b: any[]): any[][] {
  return a.map((el: any, i: number) => [el, b[i]])
}
