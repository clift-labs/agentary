/**
 * Dobbie's onboarding interview — a fun, interactive conversation
 * to learn about the user and personalise responses.
 *
 * Run automatically on first launch, or manually via `dobbie interview`.
 */

import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { saveProfile } from '../state/manager.js';

// ─────────────────────────────────────────────────────────────────────────────
// DIALOGUE LINES
// ─────────────────────────────────────────────────────────────────────────────

const INTRO_LINES = [
    `\n🧝 ${chalk.cyan('*peeks out from behind a stack of scrolls*')}`,
    `\n   Oh! A new face! Dobbie is ${chalk.bold('so')} excited!`,
    `   Dobbie has never had a proper introduction, you see.`,
    `   ${chalk.gray('*clears throat and stands up very straight*')}\n`,
    `   Let Dobbie ask a few questions so Dobbie can serve you better!\n`,
];

const REACTIONS = {
    name: [
        (n: string) => `   ${chalk.cyan(`*bounces with joy*`)} What a wonderful name! ${chalk.bold(n)}! Dobbie will remember it forever!`,
        (n: string) => `   ${chalk.cyan(`*scribbles furiously on parchment*`)} ${chalk.bold(n)}... got it! Dobbie has excellent penmanship!`,
        (n: string) => `   ${chalk.cyan(`*whispers reverently*`)} ${chalk.bold(n)}... a fine name indeed!`,
    ],
    honorific: [
        (h: string) => `   ${chalk.cyan(`*nods solemnly*`)} Dobbie shall address you as "${chalk.bold(h)}" from now on. Very distinguished!`,
        (h: string) => `   ${chalk.cyan(`*practices saying it*`)} "${chalk.bold(h)}..." Yes, yes, Dobbie likes the sound of that!`,
        (h: string) => `   "${chalk.bold(h)}" it is! Dobbie has updated all his scrolls accordingly!`,
    ],
    work: [
        (w: string) => `   ${chalk.cyan(`*eyes go wide*`)} ${chalk.bold(w)}?! That sounds fascinating! Dobbie wishes he could do that too!`,
        (w: string) => `   ${chalk.cyan(`*adjusts spectacles*`)} Ah, ${chalk.bold(w)}! Dobbie has heard of such noble work!`,
        (w: string) => `   ${chalk.cyan(`*takes careful notes*`)} ${chalk.bold(w)}... Dobbie will keep this in mind when helping you!`,
    ],
    family: [
        () => `   ${chalk.cyan(`*wipes a tear*`)} How lovely! Dobbie is touched you shared that!`,
        () => `   ${chalk.cyan(`*clutches heart*`)} Family is important! Dobbie knows this well.`,
        () => `   ${chalk.cyan(`*smiles warmly*`)} Dobbie will remember this. Family context helps Dobbie help you!`,
    ],
    car: {
        yes: [
            `   ${chalk.cyan(`*pretends to drive*`)} Vroom vroom! Dobbie has always wanted to ride in one!`,
            `   ${chalk.cyan(`*nods approvingly*`)} A chariot of steel! Very practical, very practical.`,
        ],
        no: [
            `   ${chalk.cyan(`*nods wisely*`)} No car! Dobbie respects that. Dobbie gets everywhere by apparition anyway.`,
            `   ${chalk.cyan(`*taps chin*`)} Public transport or teleportation? Either way, Dobbie approves!`,
        ],
    },
    city_live: [
        (c: string) => `   ${chalk.cyan(`*pulls out a tiny map*`)} ${chalk.bold(c)}! Dobbie has heard stories about that place!`,
        (c: string) => `   ${chalk.cyan(`*marks it on his scroll*`)} ${chalk.bold(c)}... noted! Dobbie will factor this in.`,
    ],
    city_work: [
        (c: string) => `   ${chalk.cyan(`*calculates on fingers*`)} And you work in ${chalk.bold(c)}! Dobbie sees, Dobbie sees.`,
        (c: string) => `   ${chalk.cyan(`*draws a line on his map*`)} ${chalk.bold(c)} for work! Dobbie has the full picture now!`,
    ],
};

const OUTRO_LINES = [
    `\n🧝 ${chalk.cyan(`*rolls up parchment and stores it carefully*`)}`,
    `   Splendid! Dobbie knows everything Dobbie needs to know!`,
    `   Dobbie is now ${chalk.bold('fully calibrated')} and ready to serve.`,
    `   ${chalk.gray(`(You can update your profile anytime with: dobbie interview)`)}\n`,
];

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function pick<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function pause(ms = 400): Promise<void> {
    return new Promise((res) => setTimeout(res, ms));
}

async function printLines(lines: string[]): Promise<void> {
    for (const line of lines) {
        console.log(line);
        await pause(300);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// INTERVIEW FLOW
// ─────────────────────────────────────────────────────────────────────────────

export async function runInterview(): Promise<void> {
    await printLines(INTRO_LINES);

    // 1. Name
    const { name } = await inquirer.prompt([{
        type: 'input',
        name: 'name',
        message: chalk.cyan('🧝 What is your name?'),
        validate: (v: string) => v.trim().length > 0 || 'Dobbie needs at least one letter!',
    }]);
    console.log(pick(REACTIONS.name)(name.trim()));
    await pause();

    // 2. Honorific
    const { honorificChoice } = await inquirer.prompt([{
        type: 'list',
        name: 'honorificChoice',
        message: chalk.cyan('🧝 How would you like Dobbie to address you?'),
        choices: [
            { name: 'Sir', value: 'sir' },
            { name: 'Ma\'am', value: 'ma\'am' },
            { name: 'Boss', value: 'boss' },
            { name: 'Captain', value: 'captain' },
            { name: 'Friend', value: 'friend' },
            { name: 'Chief', value: 'chief' },
            { name: 'Other (let me type it)', value: '__custom__' },
        ],
    }]);

    let honorific = honorificChoice;
    if (honorificChoice === '__custom__') {
        const { custom } = await inquirer.prompt([{
            type: 'input',
            name: 'custom',
            message: chalk.cyan('🧝 What shall Dobbie call you?'),
            validate: (v: string) => v.trim().length > 0 || 'Dobbie needs something to call you!',
        }]);
        honorific = custom.trim();
    }
    console.log(pick(REACTIONS.honorific)(honorific));
    await pause();

    // 3. Work type
    const { workType } = await inquirer.prompt([{
        type: 'input',
        name: 'workType',
        message: chalk.cyan('🧝 What kind of work do you do?'),
        default: '',
    }]);
    if (workType.trim()) {
        console.log(pick(REACTIONS.work)(workType.trim()));
        await pause();
    }

    // 4. Family situation
    const { familySituation } = await inquirer.prompt([{
        type: 'input',
        name: 'familySituation',
        message: chalk.cyan('🧝 Tell Dobbie about your family! (or press Enter to skip)'),
        default: '',
    }]);
    if (familySituation.trim()) {
        console.log(pick(REACTIONS.family)());
        await pause();
    }

    // 5. Car
    const { hasCar } = await inquirer.prompt([{
        type: 'confirm',
        name: 'hasCar',
        message: chalk.cyan('🧝 Do you have a car?'),
        default: true,
    }]);
    console.log(pick(hasCar ? REACTIONS.car.yes : REACTIONS.car.no));
    await pause();

    // 6. City live
    const { cityLive } = await inquirer.prompt([{
        type: 'input',
        name: 'cityLive',
        message: chalk.cyan('🧝 Where do you live? (city)'),
        default: '',
    }]);
    if (cityLive.trim()) {
        console.log(pick(REACTIONS.city_live)(cityLive.trim()));
        await pause();
    }

    // 7. City work
    const { cityWork } = await inquirer.prompt([{
        type: 'input',
        name: 'cityWork',
        message: chalk.cyan('🧝 Where do you work? (city, or Enter if same / remote)'),
        default: '',
    }]);
    if (cityWork.trim()) {
        console.log(pick(REACTIONS.city_work)(cityWork.trim()));
        await pause();
    }

    // Save everything
    await saveProfile({
        userName: name.trim(),
        honorific,
        workType: workType.trim() || undefined,
        familySituation: familySituation.trim() || undefined,
        hasCar,
        cityLive: cityLive.trim() || undefined,
        cityWork: cityWork.trim() || undefined,
    });

    await printLines(OUTRO_LINES);
}

// ─────────────────────────────────────────────────────────────────────────────
// CLI COMMAND
// ─────────────────────────────────────────────────────────────────────────────

export const interviewCommand = new Command('interview')
    .description('Run (or re-run) the Dobbie onboarding interview')
    .action(async () => {
        await runInterview();
    });
