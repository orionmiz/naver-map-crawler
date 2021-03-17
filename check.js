import fs from 'fs'


const checkDuplication = () => {
    const oldTels = fs.readFileSync('logs/tels_old.txt', 'utf-8');
    const oldArr = oldTels.split('\n');

    console.log(`Old tels size : ${oldArr.length}`);

    const newTels = fs.readFileSync('logs/tels.txt', 'utf-8');
    const newArr = newTels.split('\n');

    console.log(`New tels size : ${newArr.length}`);

    const concat = oldArr.concat(newArr);

    const set = new Set(concat);

    console.log(`Merged : ${set.size}`);

    console.log(`Duplicated : ${concat.length - set.size}`);

    fs.writeFileSync('logs/cut.txt', [...set.values()].join('\n'));

}

checkDuplication();