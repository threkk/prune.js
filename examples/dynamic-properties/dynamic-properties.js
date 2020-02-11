const fn = {}
const props = ['propA', 'propB']
for (const prop of props) fn[prop] = () => console.log(`${prop} called`)

fn.propA()
fn.propB()
