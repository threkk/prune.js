export interface ProjectProps {
  root: string
  ignore: string[]
}

export default class Project {
  constructor(props: ProjectProps) {}

  async analyse(Analyser) {
    const name = Analyser.getName()
    const analyser = new Analyser(this.config)
    console.log(`[•] Starting analyser: ${name}.`)

    try {
      await analyser.start()
    } catch (e) {
      console.log(e)
    }
  }
}
