console.warn(`§l[Register system] §aReloaded!`)
import { world, system } from "@minecraft/server";
import { JsonDatabase } from "./database.js";


const db = new JsonDatabase("DB:RGSystem").load()

const registerPrefix = "§7[§l§bРегистрация§r§7] §r"
const loginPrefix = "§7[§l§bАвторизация§r§7] §r"
const resetPrefix = "§7[§l§bСмена пароля§r§7] §r"
const prefix = "-" // Префикс от команд
const time = 120 // Время
const attemps = 3 // Попытки
const minLength = 8 // Минимальная длинна пароля
const maxLength = 32 // Максимальная длинна пароля

world.afterEvents.playerSpawn.subscribe((data) => {
    const { player: player, initialSpawn: initialSpawn } = data
    if (!initialSpawn) return;
    if (!db.get(`Password:${player.name}`)) {
        db.set(`Register:${player.name}`, false)
        player.sendMessage(registerPrefix + `Зарегестрируйтесь!`)
        player.sendMessage(registerPrefix + `Используйте: §g${prefix}register <пароль> <пароль>`)
    } else {
        db.set(`Login:${player.name}`, false)
        player.sendMessage(loginPrefix + `Авторизуйтесь!`)
        player.sendMessage(loginPrefix + `Используйте: §g${prefix}login <пароль>`)
    }
    db.set(`Coordinates:${player.name}`, {
        x: player.location.x,
        y: player.location.y,
        z: player.location.z
    })
    db.set(`Time:${player.name}`, time)
    db.set(`Attemps:${player.name}`, attemps)
})



system.runInterval(() => {
    for (const player of world.getAllPlayers()) {
        if (db.get(`Register:${player.name}`) == false) {
            db.set(`Time:${player.name}`, db.get(`Time:${player.name}`) - 1)
            if (db.get(`Time:${player.name}`) < 1) {
                player.runCommandAsync(`kick "${player.name}" §r\nВы не успели зарегестрироваться!`)
            }
            player.runCommandAsync(`titleraw @s actionbar {"rawtext":[{"text":"Зарегестрируйтесь! У вас осталось §g${db.get(`Time:${player.name}`)}§r сек.\nИспользуйте: §g${prefix}register <пароль> <пароль>"}]}`)
            player.addEffect(`resistance`, 60, { amplifier: 255, showParticles: false })
            player.addEffect(`mining_fatigue`, 60, { amplifier: 255, showParticles: false })
            player.addEffect(`weakness`, 60, { amplifier: 255, showParticles: false })
            player.addEffect(`blindness`, 60, { amplifier: 1, showParticles: false })
        }
        if (db.get(`Login:${player.name}`) == false) {
            db.set(`Time:${player.name}`, db.get(`Time:${player.name}`) - 1)
            if (db.get(`Time:${player.name}`) < 1) {
                player.runCommandAsync(`kick "${player.name}" §r\nВы не успели авторизоваться!`)
            }
            player.runCommandAsync(`titleraw @s actionbar {"rawtext":[{"text":"Авторизуйтесь! У вас осталось §g${db.get(`Time:${player.name}`)}§r сек.\nИспользуйте: §g${prefix}login <пароль>"}]}`)
            player.addEffect(`resistance`, 60, { amplifier: 255, showParticles: false })
            player.addEffect(`mining_fatigue`, 60, { amplifier: 255, showParticles: false })
            player.addEffect(`weakness`, 60, { amplifier: 255, showParticles: false })
            player.addEffect(`blindness`, 60, { amplifier: 1, showParticles: false })
        }
    }
}, 20)


system.runInterval(() => {
    for (const player of world.getAllPlayers()) {
        if (db.get(`Register:${player.name}`) == false || db.get(`Login:${player.name}`) == false) {
            if (
                db.get(`Coordinates:${player.name}`).x !== player.location.x ||
                db.get(`Coordinates:${player.name}`).y.toFixed(1) !== player.location.y.toFixed(1) ||
                db.get(`Coordinates:${player.name}`).z !== player.location.z) {
                player.teleport({ x: db.get(`Coordinates:${player.name}`).x, y: db.get(`Coordinates:${player.name}`).y, z: db.get(`Coordinates:${player.name}`).z })
            }
        }
    }
})


world.beforeEvents.chatSend.subscribe((data) => {
    const { sender: player, message: message } = data
    const args = message.split(" ")
    if (message.startsWith(`${prefix}register`)) {
        data.cancel = true
        if (db.get(`Register:${player.name}`) == true) return player.sendMessage(registerPrefix + `Вы уже зарегестрировались!`)
        if (!args[2]) return player.sendMessage(registerPrefix + `Используйте §g${prefix}register <пароль> <пароль>`);
        if (args[1].length < minLength) return player.sendMessage(registerPrefix + `Пароль слишком короткий! (Минимально символов: §g${minLength}§r)`);
        if (args[1].length > maxLength) return player.sendMessage(registerPrefix + `Пароль слишком длинный! (Максимально символов: §g${maxLength}§r)`);
        if (args[1] !== args[2]) return player.sendMessage(registerPrefix + `Пароли не совпадают!`);
        db.set(`Password:${player.name}`, `${args[1]}`)
        db.set(`Register:${player.name}`, true)
        db.set(`Login:${player.name}`, true)
        player.sendMessage(registerPrefix + `Вы успешно зарегестрировались!`)
        player.sendMessage(registerPrefix + `Ваш пароль: §g${args[1]}`)
    }
    if (message.startsWith(`${prefix}login`)) {
        data.cancel = true
        if (db.get(`Register:${player.name}`) == false) return player.sendMessage(loginPrefix + `Вы ещё не зарегестрировались!`);
        if (db.get(`Login:${player.name}`) == true) return player.sendMessage(loginPrefix + `Вы уже авторизовались!`);
        if (args[1] !== db.get(`Password:${player.name}`)) {
            player.sendMessage(loginPrefix + `Не верный пароль!`)
            db.set(`Attemps:${player.name}`, db.get(`Attemps:${player.name}`) - 1)
            if (db.get(`Attemps:${player.name}`) < 1) {
                player.runCommandAsync(`kick "${player.name}" §r\nВы ввели не правильный пароль слишком много раз!`)
            }
        } else {
            player.sendMessage(loginPrefix + `Вы успешно авторизовались!`)
            db.set(`Login:${player.name}`, true)
        }
    }
    if (message.startsWith(`${prefix}reset`)) {
        data.cancel = true
        if (db.get(`Register:${player.name}`) == false) return player.sendMessage(resetPrefix + `Вы ещё не зарегестрировались!`);
        if (db.get(`Login:${player.name}`) == false) return player.sendMessage(resetPrefix + `Вы ещё не авторизовались!`);
        if (!args[1]) return player.sendMessage(resetPrefix + `Используйте: §g${prefix}reset <пароль> <пароль>`);
        if (args[1] !== args[2]) return player.sendMessage(resetPrefix + `Пароли не совпадают!`);
        if (args[1] == db.get(`Password:${player.name}`)) return player.sendMessage(resetPrefix + `Старый и новый пароль не могут совпадать!`);
        if (args[1].length < minLength) return player.sendMessage(resetPrefix + `Пароль слишком короткий! (Минимально символов: §g${minLength}§r)`);
        if (args[1].length > maxLength) return player.sendMessage(resetPrefix + `Пароль слишком длинный! (Максимально символов: §g${maxLength}§r)`);
        db.set(`Password:${player.name}`, `${args[1]}`)
        player.sendMessage(resetPrefix + `Пароль успешно изменён!`)
        player.sendMessage(resetPrefix + `Новый пароль: §g${args[1]}`)
    }
})
