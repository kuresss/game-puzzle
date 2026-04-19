export function buildGridViewModel({ holes }) {
  return holes.map((mole, index) => {
    const isDummy = mole ? mole.type === 'dummy' : false;
    const isBonus = mole ? mole.isBonus : false;
    let ariaLabel;
    if (!mole) {
      ariaLabel = `${index + 1}番 穴`;
    } else if (isDummy) {
      ariaLabel = `${index + 1}番 ダミーもぐら！`;
    } else if (isBonus) {
      ariaLabel = `${index + 1}番 ゴールデンもぐら！`;
    } else {
      ariaLabel = `${index + 1}番 もぐら！`;
    }
    return { index, hasMole: mole !== null, isBonus, isDummy, ariaLabel };
  });
}
