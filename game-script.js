const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;


/* =========================================================
   INPUT
========================================================= */

const keys = {};

const mouse = {
    x: WIDTH / 2,
    y: HEIGHT / 2,
    left: false,
    right: false
};


/* =========================================================
   MOBILE INPUT
========================================================= */

const mobileInput = {

    joystickActive: false,

    joystickX: 0,
    joystickY: 0,

    sprint: false,

    shield: false

};


const joystick = document.getElementById("joystick");
const joystickKnob =
    document.getElementById("joystickKnob");


let joystickPointerId = null;


/* =========================================================
   GAME STATE
========================================================= */

let gameStarted = false;
let gamePaused = false;
let lastTime = 0;


/* =========================================================
   SPELL
========================================================= */

const SPELL_COOLDOWN = 60;

let spellCooldown = 0;


/* =========================================================
   SPRINT
========================================================= */

let sprintExhausted = false;

const SPRINT_EXHAUST_THRESHOLD = 20;


/* =========================================================
   GAME RESET
========================================================= */

function resetGame() {

    gameStarted = true;
    gamePaused = false;

    lastTime = performance.now();


    /* PLAYER */

    player.x = WIDTH / 2;
    player.y = HEIGHT / 2;

    player.hp = 100;
    player.maxHp = 100;

    player.mana = 100;
    player.maxMana = 100;

    player.hunger = 100;
    player.maxHunger = 100;

    player.energy = 100;
    player.maxEnergy = 100;

    player.level = 1;

    player.xp = 0;
    player.xpNeeded = 100;

    player.damage = 18;

    player.attackSpeed = 0;

    player.skillDamageBonus = 0;

    player.blocking = false;

    player.facing = 0;


    /* TIMERS */

    playerStunTimer = 0;

    attackTimer = 0;

    spellCooldown = 0;

    sprintExhausted = false;


    /* ENEMIES */

    enemies = [];

    foods = [];

    bossCracks = [];

    ricochetTargets = [];

    ricochetTimer = 0;

    ultimateFlashTimer = 0;


    enemiesDefeated = 0;

    spawnTimer = 0;

    nextBossSpawn =
        randomInt(50, 80);


    /* SKILLS */

    skills.Q.timer = 0;
    skills.E.timer = 0;
    skills.R.timer = 0;
    skills.T.timer = 0;


    updateSkillManaCosts();


    /* INPUT */

    mouse.left = false;
    mouse.right = false;

    mobileInput.joystickActive = false;
    mobileInput.joystickX = 0;
    mobileInput.joystickY = 0;

    mobileInput.sprint = false;
    mobileInput.shield = false;


    keys["shift"] = false;


    resetJoystick();


    /* START SCREEN */

    const startScreen =
        document.getElementById("startScreen");

    if (startScreen) {

        startScreen.style.display = "none";

    }


    updateHUD();

}


/* =========================================================
   START GAME
========================================================= */

function initializeStartButton() {

    const startButton =
        document.getElementById("startButton");

    if (!startButton) {
        return;
    }


    startButton.addEventListener(
        "click",
        function(event) {

            event.preventDefault();

            event.stopPropagation();

            resetGame();

        }
    );

}


if (
    document.readyState === "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeStartButton
    );

}

else {

    initializeStartButton();

}


/* =========================================================
   RESTART BUTTON
========================================================= */

const restartButton =
    document.getElementById("restartButton");


if (restartButton) {

    restartButton.addEventListener(
        "click",
        function(event) {

            event.preventDefault();

            event.stopPropagation();

            resetGame();

        }
    );

}


/* =========================================================
   KEYBOARD
========================================================= */

window.addEventListener(
    "keydown",
    function(event) {

        const key =
            event.key.toLowerCase();


        keys[key] = true;


        /* ESC */

        if (key === "escape") {

            if (!gameStarted) {
                return;
            }


            gamePaused =
                !gamePaused;


            mouse.left = false;
            mouse.right = false;


            lastTime =
                performance.now();


            return;

        }


        if (event.repeat) {
            return;
        }


        /* SPACE */

        if (key === " ") {

            event.preventDefault();

            useSpell();

            return;

        }


        /* SKILLS */

        if (key === "q") {
            useSkill("Q");
        }

        if (key === "e") {
            useSkill("E");
        }

        if (key === "r") {
            useSkill("R");
        }

        if (key === "t") {
            useSkill("T");
        }

    }
);


window.addEventListener(
    "keyup",
    function(event) {

        keys[
            event.key.toLowerCase()
        ] = false;

    }
);


/* =========================================================
   MOUSE
========================================================= */

canvas.addEventListener(
    "mousemove",
    function(event) {

        const rect =
            canvas.getBoundingClientRect();


        mouse.x =
            (event.clientX - rect.left) *
            WIDTH /
            rect.width;


        mouse.y =
            (event.clientY - rect.top) *
            HEIGHT /
            rect.height;

    }
);


canvas.addEventListener(
    "mousedown",
    function(event) {

        if (gamePaused) {
            return;
        }


        if (event.button === 0) {

            mouse.left = true;

            basicAttack();

        }


        if (event.button === 2) {

            mouse.right = true;

        }

    }
);


canvas.addEventListener(
    "mouseup",
    function(event) {

        if (event.button === 0) {

            mouse.left = false;

        }


        if (event.button === 2) {

            mouse.right = false;

        }

    }
);


canvas.addEventListener(
    "contextmenu",
    function(event) {

        event.preventDefault();

    }
);


/* =========================================================
   MOBILE SCREEN TAP = BASIC ATTACK
========================================================= */

canvas.addEventListener(
    "touchstart",
    function(event) {

        /*
         * Do not interfere with mobile
         * control buttons.
         *
         * A touch directly on the game
         * canvas performs a basic attack.
         */

        if (
            !gameStarted ||
            gamePaused
        ) {

            return;

        }


        if (
            event.touches.length > 0
        ) {

            const touch =
                event.touches[0];


            const rect =
                canvas.getBoundingClientRect();


            mouse.x =
                (touch.clientX -
                 rect.left) *
                WIDTH /
                rect.width;


            mouse.y =
                (touch.clientY -
                 rect.top) *
                HEIGHT /
                rect.height;


            basicAttack();

        }

    },
    {
        passive: false
    }
);


/* =========================================================
   JOYSTICK
========================================================= */

function updateJoystick(
    clientX,
    clientY
) {

    const rect =
        joystick.getBoundingClientRect();


    const centerX =
        rect.left +
        rect.width / 2;


    const centerY =
        rect.top +
        rect.height / 2;


    let dx =
        clientX -
        centerX;


    let dy =
        clientY -
        centerY;


    const radius =
        rect.width / 2;


    const distance =
        Math.hypot(
            dx,
            dy
        );


    if (
        distance >
        radius
    ) {

        dx =
            dx /
            distance *
            radius;


        dy =
            dy /
            distance *
            radius;

    }


    const normalizedDistance =
        Math.min(
            1,
            Math.hypot(dx, dy) /
            radius
        );


    if (
        normalizedDistance <
        0.12
    ) {

        mobileInput.joystickX = 0;
        mobileInput.joystickY = 0;

    }

    else {

        mobileInput.joystickX =
            dx / radius;


        mobileInput.joystickY =
            dy / radius;

    }


    joystickKnob.style.transform =
        `translate(
            calc(-50% + ${dx}px),
            calc(-50% + ${dy}px)
        )`;

}


function resetJoystick() {

    mobileInput.joystickActive = false;

    mobileInput.joystickX = 0;
    mobileInput.joystickY = 0;

    if (joystickKnob) {

        joystickKnob.style.transform =
            "translate(-50%, -50%)";

    }

}


if (joystick) {

    joystick.addEventListener(
        "pointerdown",
        function(event) {

            event.preventDefault();

            joystickPointerId =
                event.pointerId;

            mobileInput.joystickActive =
                true;

            joystick.setPointerCapture(
                event.pointerId
            );


            updateJoystick(
                event.clientX,
                event.clientY
            );

        }
    );


    joystick.addEventListener(
        "pointermove",
        function(event) {

            if (
                event.pointerId !==
                joystickPointerId
            ) {

                return;

            }


            updateJoystick(
                event.clientX,
                event.clientY
            );

        }
    );


    joystick.addEventListener(
        "pointerup",
        function(event) {

            if (
                event.pointerId !==
                joystickPointerId
            ) {

                return;

            }


            resetJoystick();

            joystickPointerId = null;

        }
    );


    joystick.addEventListener(
        "pointercancel",
        function() {

            resetJoystick();

            joystickPointerId = null;

        }
    );

}


/* =========================================================
   MOBILE SPRINT
========================================================= */

const mobileSprint =
    document.getElementById(
        "mobileSprint"
    );


function setSprint(active) {

    mobileInput.sprint =
        active;


    if (mobileSprint) {

        mobileSprint.classList.toggle(
            "active",
            active &&
            !sprintExhausted
        );

    }

}


if (mobileSprint) {

    mobileSprint.addEventListener(
        "pointerdown",
        function(event) {

            event.preventDefault();

            event.stopPropagation();


            if (
                sprintExhausted
            ) {

                return;

            }


            setSprint(true);

        }
    );


    mobileSprint.addEventListener(
        "pointerup",
        function(event) {

            event.preventDefault();

            setSprint(false);

        }
    );


    mobileSprint.addEventListener(
        "pointercancel",
        function() {

            setSprint(false);

        }
    );


    mobileSprint.addEventListener(
        "pointerleave",
        function() {

            setSprint(false);

        }
    );

}


/* =========================================================
   MOBILE SHIELD
========================================================= */

const mobileShield =
    document.getElementById(
        "mobileShield"
    );


function setShield(active) {

    mobileInput.shield =
        active;


    if (mobileShield) {

        mobileShield.classList.toggle(
            "active",
            active
        );

    }

}


if (mobileShield) {

    mobileShield.addEventListener(
        "pointerdown",
        function(event) {

            event.preventDefault();

            event.stopPropagation();

            setShield(true);

        }
    );


    mobileShield.addEventListener(
        "pointerup",
        function(event) {

            event.preventDefault();

            setShield(false);

        }
    );


    mobileShield.addEventListener(
        "pointercancel",
        function() {

            setShield(false);

        }
    );

}


/* =========================================================
   MOBILE SKILL BUTTONS
========================================================= */

function connectMobileSkill(
    elementId,
    skillKey
) {

    const element =
        document.getElementById(
            elementId
        );


    if (!element) {
        return;
    }


    element.addEventListener(
        "pointerdown",
        function(event) {

            event.preventDefault();

            event.stopPropagation();

            useSkill(skillKey);

        }
    );

}


connectMobileSkill(
    "mobileSkillQ",
    "Q"
);

connectMobileSkill(
    "mobileSkillE",
    "E"
);

connectMobileSkill(
    "mobileSkillR",
    "R"
);

connectMobileSkill(
    "mobileSkillT",
    "T"
);


/* =========================================================
   MOBILE REFILL
========================================================= */

const mobileRefill =
    document.getElementById(
        "mobileRefill"
    );


if (mobileRefill) {

    mobileRefill.addEventListener(
        "pointerdown",
        function(event) {

            event.preventDefault();

            event.stopPropagation();

            useSpell();

        }
    );

}


/* =========================================================
   PLAYER
========================================================= */

const player = {

    x: WIDTH / 2,
    y: HEIGHT / 2,

    size: 24,

    speed: 150,
    sprintSpeed: 280,

    hp: 100,
    maxHp: 100,

    mana: 100,
    maxMana: 100,

    hunger: 100,
    maxHunger: 100,

    energy: 100,
    maxEnergy: 100,

    level: 1,

    xp: 0,
    xpNeeded: 100,

    damage: 18,

    attackSpeed: 0,

    skillDamageBonus: 0,

    blocking: false,

    facing: 0

};


/* =========================================================
   STUN
========================================================= */

let playerStunTimer = 0;


/* =========================================================
   DAMAGE
========================================================= */

function getSkillDamage() {

    const hpConversion =
        player.hp * 0.30;

    return hpConversion * 0.60;

}


function getBasicAttackDamage() {

    const hpConversion =
        player.hp * 0.30;

    return hpConversion * 0.75;

}


function getSkillBonusDamage() {

    return (
        player.skillDamageBonus +
        getSkillDamage()
    );

}


function getBasicAttackBonusDamage() {

    return getBasicAttackDamage();

}


/* =========================================================
   ENEMIES
========================================================= */

let enemies = [];

let spawnTimer = 0;

let enemiesDefeated = 0;

let nextBossSpawn =
    randomInt(50, 80);


/* =========================================================
   FOOD
========================================================= */

let foods = [];

const FOOD_LIFETIME = 5;


/* =========================================================
   EFFECTS
========================================================= */

let bossCracks = [];

let ricochetTargets = [];

let ricochetTimer = 0;

let ultimateFlashTimer = 0;


/* =========================================================
   SKILLS
========================================================= */

const skills = {

    Q: {

        name: "POWER STRIKE",

        baseMana: 15,
        mana: 15,

        cooldown: 1,
        timer: 0

    },


    E: {

        name: "RICOCHET",

        baseMana: 20,
        mana: 20,

        cooldown: 2,
        timer: 0

    },


    R: {

        name: "SHOCKWAVE",

        baseMana: 40,
        mana: 40,

        cooldown: 4,
        timer: 0

    },


    T: {

        name: "ULTIMATE",

        baseMana: 70,
        mana: 70,

        cooldown: 10,
        timer: 0

    }

};


/* =========================================================
   MANA COSTS
========================================================= */

function updateSkillManaCosts() {

    for (const key in skills) {

        const skill =
            skills[key];


        skill.mana =
            skill.baseMana +
            (
                (player.level - 1) *
                5
            );

    }

}


/* =========================================================
   RANDOM
========================================================= */

function randomInt(min, max) {

    return Math.floor(
        Math.random() *
        (max - min + 1)
    ) + min;

}


/* =========================================================
   ENEMY LEVEL
========================================================= */

function getEnemyLevelMultiplier() {

    return (
        1 +
        (
            (player.level - 1) *
            0.12
        )
    );

}


/* =========================================================
   SPAWN ENEMY
========================================================= */

function spawnEnemy(
    forceBoss = false
) {

    const side =
        Math.floor(
            Math.random() * 4
        );


    let x;
    let y;


    if (side === 0) {

        x = Math.random() * WIDTH;
        y = 30;

    }

    else if (side === 1) {

        x = WIDTH - 30;
        y = Math.random() * HEIGHT;

    }

    else if (side === 2) {

        x = Math.random() * WIDTH;
        y = HEIGHT - 30;

    }

    else {

        x = 30;
        y = Math.random() * HEIGHT;

    }


    if (forceBoss) {

        spawnBoss(x, y);

        return;

    }


    const roll =
        Math.random();


    let enemyType;


    if (roll < 0.60) {

        enemyType = "normal";

    }

    else if (roll < 0.80) {

        enemyType = "tank";

    }

    else {

        enemyType = "ranged";

    }


    const multiplier =
        getEnemyLevelMultiplier();


    let enemy;


    if (enemyType === "normal") {

        const baseHp = 40;


        enemy = {

            type: "normal",

            x,
            y,

            size: 22,

            hp:
                baseHp *
                multiplier,

            maxHp:
                baseHp *
                multiplier,

            speed:
                65 *
                multiplier,

            damage:
                7.5 *
                multiplier,

            attackRange: 30,

            attackCooldown: 1.4,

            attackTimer: 0,

            stunTimer: 0

        };

    }


    else if (enemyType === "tank") {

        const baseHp = 145;


        enemy = {

            type: "tank",

            x,
            y,

            size: 30,

            hp:
                baseHp *
                multiplier,

            maxHp:
                baseHp *
                multiplier,

            speed:
                45 *
                multiplier,

            damage:
                3.5 *
                multiplier,

            attackRange: 35,

            attackCooldown: 2.2,

            attackTimer: 0,

            stunTimer: 0

        };

    }


    else {

        const baseHp = 30;


        enemy = {

            type: "ranged",

            x,
            y,

            size: 20,

            hp:
                baseHp *
                multiplier,

            maxHp:
                baseHp *
                multiplier,

            speed:
                55 *
                multiplier,

            damage:
                3.2 *
                multiplier,

            attackRange: 85,

            attackCooldown: 0.7,

            attackTimer: 0,

            stunTimer: 0

        };

    }


    enemies.push(enemy);

}


/* =========================================================
   BOSS
========================================================= */

function spawnBoss(x, y) {

    const multiplier =
        getEnemyLevelMultiplier();


    const baseHp = 195;


    const boss = {

        type: "boss",

        x,
        y,

        size: 42,

        hp:
            baseHp *
            multiplier,

        maxHp:
            baseHp *
            multiplier,

        speed:
            65 *
            multiplier,

        damage:
            11 *
            multiplier,

        attackRange: 48,

        attackCooldown: 1.4,

        attackTimer: 0,

        stunTimer: 0,


        groundSkillCooldown: 12,

        groundSkillTimer: 4,

        groundSkillWarning: false,

        groundSkillWarningTime: 1.5,

        groundSkillAngle: 0,

        groundSkillX: x,

        groundSkillY: y,


        barrierCooldown: 4,

        barrierTimer: 4,

        barrierActive: false,

        barrierDuration: 1,

        barrierTimeRemaining: 0,

        barrierRadius: 100

    };


    enemies.push(boss);

}


/* =========================================================
   PLAYER MOVEMENT
========================================================= */

function updatePlayer(dt) {

    let dx = 0;
    let dy = 0;


    /* KEYBOARD */

    if (keys["w"]) {
        dy -= 1;
    }

    if (keys["s"]) {
        dy += 1;
    }

    if (keys["a"]) {
        dx -= 1;
    }

    if (keys["d"]) {
        dx += 1;
    }


    /* MOBILE JOYSTICK */

    if (
        mobileInput.joystickActive ||
        mobileInput.joystickX !== 0 ||
        mobileInput.joystickY !== 0
    ) {

        dx =
            mobileInput.joystickX;

        dy =
            mobileInput.joystickY;

    }


    const moving =
        dx !== 0 ||
        dy !== 0;


    let speed =
        player.speed;


    /* =====================================================
       SPRINT
    ===================================================== */

    const keyboardSprint =
        keys["shift"];


    const mobileSprintActive =
        mobileInput.sprint;


    const sprinting =
        (
            keyboardSprint ||
            mobileSprintActive
        ) &&
        moving;


    if (
        sprinting &&
        !sprintExhausted &&
        player.energy > 0
    ) {

        speed =
            player.sprintSpeed;


        player.energy -=
            25 * dt;


        /*
         * Once energy reaches 20%,
         * sprint becomes exhausted.
         */

        const energyPercent =
            player.energy /
            player.maxEnergy *
            100;


        if (
            energyPercent <=
            SPRINT_EXHAUST_THRESHOLD
        ) {

            player.energy =
                player.maxEnergy *
                0.20;


            sprintExhausted =
                true;


            keys["shift"] = false;

            mobileInput.sprint =
                false;


            if (mobileSprint) {

                mobileSprint.classList.remove(
                    "active"
                );

                mobileSprint.classList.add(
                    "exhausted"
                );

            }

        }

    }

    else if (player.blocking) {

        player.energy -=
            20 * dt;

    }

    else {

        /*
         * Energy regenerates normally.
         */

        player.energy +=
            15 * dt;

    }


    /* =====================================================
       ENERGY
    ===================================================== */

    player.energy =
        Math.max(
            0,
            Math.min(
                player.maxEnergy,
                player.energy
            )
        );


    /*
     * IMPORTANT:
     *
     * Sprint stays locked after
     * reaching 20%.
     *
     * It only unlocks at 100%.
     */

    if (
        sprintExhausted &&
        player.energy >=
        player.maxEnergy
    ) {

        player.energy =
            player.maxEnergy;


        sprintExhausted =
            false;


        if (mobileSprint) {

            mobileSprint.classList.remove(
                "exhausted"
            );

        }

    }


    /* =====================================================
       MOVEMENT
    ===================================================== */

    if (moving) {

        const length =
            Math.sqrt(
                dx * dx +
                dy * dy
            );


        if (length > 0) {

            dx /= length;
            dy /= length;


            player.x +=
                dx *
                speed *
                dt;


            player.y +=
                dy *
                speed *
                dt;

        }

    }


    /* MAP BOUNDARIES */

    player.x =
        Math.max(
            player.size,
            Math.min(
                WIDTH -
                player.size,
                player.x
            )
        );


    player.y =
        Math.max(
            player.size,
            Math.min(
                HEIGHT -
                player.size,
                player.y
            )
        );


    /* =====================================================
       FACING
    ===================================================== */

    /*
     * On mobile, the player faces
     * the joystick direction.
     */

    if (
        mobileInput.joystickX !== 0 ||
        mobileInput.joystickY !== 0
    ) {

        player.facing =
            Math.atan2(
                mobileInput.joystickY,
                mobileInput.joystickX
            );

    }

    else {

        player.facing =
            Math.atan2(
                mouse.y -
                player.y,

                mouse.x -
                player.x
            );

    }


    /* =====================================================
       BLOCK
    ===================================================== */

    player.blocking =
        (
            mouse.right ||
            mobileInput.shield
        ) &&
        player.energy > 0;


    /* =====================================================
       DESKTOP HELD ATTACK
    ===================================================== */

    if (mouse.left) {

        basicAttack();

    }

}


/* =========================================================
   FACING CHECK
========================================================= */

function isFacingTarget(
    target,
    maxAngle = Math.PI / 4
) {

    const angleToTarget =
        Math.atan2(
            target.y -
            player.y,

            target.x -
            player.x
        );


    let difference =
        angleToTarget -
        player.facing;


    while (
        difference >
        Math.PI
    ) {

        difference -=
            Math.PI * 2;

    }


    while (
        difference <
        -Math.PI
    ) {

        difference +=
            Math.PI * 2;

    }


    return (
        Math.abs(difference) <=
        maxAngle
    );

}


/* =========================================================
   BASIC ATTACK
========================================================= */

let attackTimer = 0;


function getAttackCooldown() {

    return Math.max(
        0.05,
        0.38 -
        player.attackSpeed
    );

}


function basicAttack() {

    if (
        !gameStarted ||
        gamePaused
    ) {

        return;

    }


    if (
        playerStunTimer > 0
    ) {

        return;

    }


    if (
        attackTimer > 0
    ) {

        return;

    }


    attackTimer =
        getAttackCooldown();


    const attackRange =
        110;


    let target = null;

    let closestDistance =
        attackRange;


    enemies.forEach(
        enemy => {

            const distance =
                Math.hypot(
                    enemy.x -
                    player.x,

                    enemy.y -
                    player.y
                );


            if (
                distance <=
                closestDistance &&
                isFacingTarget(enemy)
            ) {

                if (
                    isProtectedByBossBarrier(
                        enemy
                    )
                ) {

                    return;

                }


                closestDistance =
                    distance;

                target =
                    enemy;

            }

        }
    );


    if (target) {

        const damage =
            player.damage +
            getBasicAttackBonusDamage();


        target.hp -=
            damage;

    }

}


/* =========================================================
   SKILLS
========================================================= */

function useSkill(key) {

    if (
        !gameStarted ||
        gamePaused
    ) {

        return;

    }


    if (
        playerStunTimer > 0
    ) {

        return;

    }


    const skill =
        skills[key];


    if (!skill) {

        return;

    }


    if (
        skill.timer > 0
    ) {

        return;

    }


    if (
        player.mana <
        skill.mana
    ) {

        return;

    }


    player.mana -=
        skill.mana;


    skill.timer =
        skill.cooldown;


    /* =====================================================
       Q
    ===================================================== */

    if (key === "Q") {

        const skillDamage =
            player.damage * 2 +
            getSkillBonusDamage();


        enemies.forEach(
            enemy => {

                const distance =
                    Math.hypot(
                        enemy.x -
                        player.x,

                        enemy.y -
                        player.y
                    );


                if (
                    distance < 90 &&
                    isFacingTarget(
                        enemy,
                        Math.PI / 3
                    )
                ) {

                    if (
                        isProtectedByBossBarrier(
                            enemy
                        )
                    ) {

                        return;

                    }


                    enemy.hp -=
                        skillDamage;

                }

            }
        );

    }


    /* =====================================================
       E
    ===================================================== */

    if (key === "E") {

        const maxTargets = 7;


        const skillDamage =
            player.damage * 3 +
            getSkillBonusDamage();


        let targets =
            enemies

                .map(
                    enemy => {

                        return {

                            enemy,

                            distance:
                                Math.hypot(
                                    enemy.x -
                                    player.x,

                                    enemy.y -
                                    player.y
                                )

                        };

                    }
                )

                .filter(
                    data => {

                        return (
                            data.distance <= 250 &&
                            isFacingTarget(
                                data.enemy,
                                Math.PI / 3
                            )
                        );

                    }
                )

                .sort(
                    (a, b) =>
                        a.distance -
                        b.distance
                )

                .slice(
                    0,
                    maxTargets
                );


        if (
            targets.length > 0
        ) {

            const multipliers = [

                1.00,
                0.80,
                0.60,
                0.40,
                0.30,
                0.20,
                0.10

            ];


            targets.forEach(
                (data, index) => {

                    if (
                        isProtectedByBossBarrier(
                            data.enemy
                        )
                    ) {

                        return;

                    }


                    data.enemy.hp -=
                        skillDamage *
                        multipliers[index];

                }
            );


            ricochetTargets =
                targets.map(
                    data =>
                        data.enemy
                );


            ricochetTimer =
                0.25;

        }

    }


    /* =====================================================
       R
    ===================================================== */

    if (key === "R") {

        const skillDamage =
            player.damage * 3 +
            getSkillBonusDamage();


        enemies.forEach(
            enemy => {

                const distance =
                    Math.hypot(
                        enemy.x -
                        player.x,

                        enemy.y -
                        player.y
                    );


                if (
                    distance < 110
                ) {

                    if (
                        isProtectedByBossBarrier(
                            enemy
                        )
                    ) {

                        return;

                    }


                    enemy.hp -=
                        skillDamage;


                    enemy.stunTimer =
                        0.3;

                }

            }
        );

    }


    /* =====================================================
       T
    ===================================================== */

    if (key === "T") {

        if (
            enemies.length > 0
        ) {

            const totalDamage =
                player.damage * 10 +
                getSkillBonusDamage() * 2;


            const damagePerEnemy =
                totalDamage /
                enemies.length;


            enemies.forEach(
                enemy => {

                    if (
                        isProtectedByBossBarrier(
                            enemy
                        )
                    ) {

                        return;

                    }


                    enemy.hp -=
                        damagePerEnemy;

                }
            );

        }


        ultimateFlashTimer =
            0.35;

    }

}


/* =========================================================
   REFILL
========================================================= */

function useSpell() {

    if (
        !gameStarted ||
        gamePaused
    ) {

        return;

    }


    if (
        spellCooldown > 0
    ) {

        return;

    }


    player.hp =
        player.maxHp;

    player.mana =
        player.maxMana;

    player.energy =
        player.maxEnergy;

    player.hunger =
        player.maxHunger;


    /*
     * Refill also clears sprint
     * exhaustion.
     */

    sprintExhausted =
        false;


    if (mobileSprint) {

        mobileSprint.classList.remove(
            "exhausted"
        );

    }


    spellCooldown =
        SPELL_COOLDOWN;

}


/* =========================================================
   BOSS PROTECTION
========================================================= */

function isProtectedByBossBarrier(
    enemy
) {

    const boss =
        enemies.find(
            e =>
                e.type === "boss"
        );


    if (!boss) {
        return false;
    }


    if (
        !boss.barrierActive
    ) {

        return false;

    }


    if (
        enemy === boss
    ) {

        return true;

    }


    const distance =
        Math.hypot(
            enemy.x -
            boss.x,

            enemy.y -
            boss.y
        );


    return (
        distance <=
        boss.barrierRadius
    );

}


/* =========================================================
   UPDATE ENEMIES
========================================================= */

function updateEnemies(dt) {

    enemies.forEach(
        enemy => {

            if (
                enemy.stunTimer > 0
            ) {

                enemy.stunTimer -=
                    dt;

                return;

            }


            if (
                enemy.type === "boss"
            ) {

                updateBoss(
                    enemy,
                    dt
                );

            }


            const dx =
                player.x -
                enemy.x;

            const dy =
                player.y -
                enemy.y;


            const distance =
                Math.hypot(
                    dx,
                    dy
                );


            if (
                distance >
                enemy.attackRange
            ) {

                if (
                    distance > 0
                ) {

                    enemy.x +=
                        dx /
                        distance *
                        enemy.speed *
                        dt;


                    enemy.y +=
                        dy /
                        distance *
                        enemy.speed *
                        dt;

                }

            }

            else {

                enemy.attackTimer -=
                    dt;


                if (
                    enemy.attackTimer <= 0
                ) {

                    enemy.attackTimer =
                        enemy.attackCooldown;


                    if (
                        !player.blocking
                    ) {

                        player.hp -=
                            enemy.damage;

                    }

                    else {

                        player.hp -=
                            enemy.damage *
                            0.25;

                    }

                }

            }

        }
    );


    /* =====================================================
       REMOVE DEAD ENEMIES
    ===================================================== */

    enemies =
        enemies.filter(
            enemy => {

                if (
                    enemy.hp <= 0
                ) {

                    /*
                     * THIS is the actual
                     * kill counter.
                     */

                    enemiesDefeated++;


                    gainXP(25);


                    if (
                        enemy.type !== "boss" &&
                        Math.random() < 0.12
                    ) {

                        dropFood(
                            enemy.x,
                            enemy.y,
                            false
                        );

                    }


                    if (
                        enemy.type === "boss" &&
                        Math.random() < 0.05
                    ) {

                        dropFood(
                            enemy.x,
                            enemy.y,
                            true
                        );

                    }


                    if (
                        enemy.type === "boss"
                    ) {

                        nextBossSpawn =
                            enemiesDefeated +
                            randomInt(
                                50,
                                80
                            );

                    }


                    return false;

                }


                return true;

            }
        );

}


/* =========================================================
   BOSS UPDATE
========================================================= */

function updateBoss(
    boss,
    dt
) {

    if (
        boss.groundSkillWarning
    ) {

        boss.groundSkillWarningTime -=
            dt;


        if (
            boss.groundSkillWarningTime <= 0
        ) {

            boss.groundSkillWarning =
                false;


            boss.groundSkillTimer =
                boss.groundSkillCooldown;


            bossGroundSmash(
                boss
            );

        }

    }

    else {

        boss.groundSkillTimer -=
            dt;


        if (
            boss.groundSkillTimer <= 0
        ) {

            boss.groundSkillX =
                player.x;


            boss.groundSkillY =
                player.y;


            boss.groundSkillAngle =
                Math.atan2(
                    boss.groundSkillY -
                    boss.y,

                    boss.groundSkillX -
                    boss.x
                );


            boss.groundSkillWarning =
                true;


            boss.groundSkillWarningTime =
                1.5;

        }

    }


    /* BARRIER */

    if (
        boss.barrierActive
    ) {

        boss.barrierTimeRemaining -=
            dt;


        if (
            boss.barrierTimeRemaining <= 0
        ) {

            boss.barrierActive =
                false;

        }

    }

    else {

        boss.barrierTimer -=
            dt;


        if (
            boss.barrierTimer <= 0
        ) {

            boss.barrierTimer =
                boss.barrierCooldown;


            boss.barrierActive =
                true;


            boss.barrierTimeRemaining =
                boss.barrierDuration;

        }

    }

}


/* =========================================================
   BOSS GROUND SMASH
========================================================= */

function bossGroundSmash(
    boss
) {

    const angle =
        boss.groundSkillAngle;


    const crackLength =
        280;


    const crack = {

        x: boss.x,

        y: boss.y,

        angle,

        length:
            crackLength,

        width: 28,

        timer: 0.9

    };


    bossCracks.push(
        crack
    );


    const px =
        player.x -
        boss.x;


    const py =
        player.y -
        boss.y;


    const forward =
        px *
        Math.cos(angle) +
        py *
        Math.sin(angle);


    const perpendicular =
        Math.abs(
            -px *
            Math.sin(angle) +
            py *
            Math.cos(angle)
        );


    if (
        forward >= 0 &&
        forward <= crackLength &&
        perpendicular <=
            crack.width / 2 +
            player.size / 2
    ) {

        playerStunTimer =
            0.7;

    }

}


/* =========================================================
   XP
========================================================= */

function gainXP(amount) {

    player.xp +=
        amount;


    while (
        player.xp >=
        player.xpNeeded
    ) {

        player.xp -=
            player.xpNeeded;


        player.level++;


        player.xpNeeded =
            Math.floor(
                player.xpNeeded *
                1.4
            );


        player.maxHp +=
            10;

        player.hp =
            player.maxHp;


        player.maxMana +=
            10;

        player.mana =
            player.maxMana;


        player.damage +=
            3;


        player.speed +=
            0.011;


        player.attackSpeed +=
            0.003;


        player.skillDamageBonus +=
            3.5;


        updateSkillManaCosts();

    }

}


/* =========================================================
   STATS
========================================================= */

function updateStats(dt) {

    if (
        playerStunTimer > 0
    ) {

        playerStunTimer -=
            dt;

    }


    player.hunger -=
        1 * dt;


    player.hunger =
        Math.max(
            0,
            player.hunger
        );


    player.mana +=
        8 * dt;


    player.mana =
        Math.min(
            player.maxMana,
            player.mana
        );


    if (
        spellCooldown > 0
    ) {

        spellCooldown -=
            dt;


        spellCooldown =
            Math.max(
                0,
                spellCooldown
            );

    }


    if (
        player.hunger <= 0
    ) {

        player.hp -=
            2 * dt;

    }

}


/* =========================================================
   COOLDOWNS
========================================================= */

function updateCooldowns(dt) {

    attackTimer =
        Math.max(
            0,
            attackTimer -
            dt
        );


    for (
        const key in skills
    ) {

        skills[key].timer =
            Math.max(
                0,
                skills[key].timer -
                dt
            );

    }


    if (
        ricochetTimer > 0
    ) {

        ricochetTimer -=
            dt;

    }


    if (
        ultimateFlashTimer > 0
    ) {

        ultimateFlashTimer -=
            dt;

    }


    bossCracks.forEach(
        crack => {

            crack.timer -=
                dt;

        }
    );


    bossCracks =
        bossCracks.filter(
            crack =>
                crack.timer > 0
        );

}


/* =========================================================
   SPAWNING
========================================================= */

function updateSpawning(dt) {

    spawnTimer -=
        dt;


    const spawnInterval =
        Math.max(
            0.45,
            2 -
            (
                (player.level - 1) *
                0.12
            )
        );


    if (
        spawnTimer <= 0 &&
        enemies.length < 10
    ) {

        spawnEnemy();


        spawnTimer =
            spawnInterval;

    }


    if (
        enemiesDefeated >=
        nextBossSpawn
    ) {

        const bossAlreadyAlive =
            enemies.some(
                enemy =>
                    enemy.type ===
                    "boss"
            );


        if (
            !bossAlreadyAlive
        ) {

            spawnEnemy(true);


            nextBossSpawn =
                enemiesDefeated +
                randomInt(
                    50,
                    80
                );

        }

    }

}


/* =========================================================
   FOOD
========================================================= */

function dropFood(
    x,
    y,
    fullRestore
) {

    foods.push({

        x,
        y,

        size: 14,

        timer:
            FOOD_LIFETIME,

        fullRestore

    });

}


function updateFood(dt) {

    foods.forEach(
        food => {

            food.timer -=
                dt;


            const distance =
                Math.hypot(
                    food.x -
                    player.x,

                    food.y -
                    player.y
                );


            if (
                distance <=
                player.size +
                food.size
            ) {

                if (
                    food.fullRestore
                ) {

                    player.hunger =
                        player.maxHunger;

                }

                else {

                    player.hunger +=
                        25;


                    player.hunger =
                        Math.min(
                            player.maxHunger,
                            player.hunger
                        );

                }


                food.timer =
                    0;

            }

        }
    );


    foods =
        foods.filter(
            food =>
                food.timer > 0
        );

}


/* =========================================================
   HUD
========================================================= */

function updateHUD() {

    setBar(
        "hpBar",
        player.hp,
        player.maxHp
    );


    setBar(
        "manaBar",
        player.mana,
        player.maxMana
    );


    setBar(
        "hungerBar",
        player.hunger,
        player.maxHunger
    );


    setBar(
        "energyBar",
        player.energy,
        player.maxEnergy
    );


    setText(
        "hpText",
        `${Math.ceil(player.hp)} / ${player.maxHp}`
    );


    setText(
        "manaText",
        `${Math.ceil(player.mana)} / ${player.maxMana}`
    );


    setText(
        "hungerText",
        `${Math.ceil(player.hunger)} / ${player.maxHunger}`
    );


    setText(
        "energyText",
        `${Math.ceil(player.energy)} / ${player.maxEnergy}`
    );


    setText(
        "levelText",
        player.level
    );


    setText(
        "xpText",
        `${Math.floor(player.xp)} / ${player.xpNeeded}`
    );


    /*
     * IMPORTANT:
     *
     * enemyCount now represents
     * enemies killed, NOT enemies alive.
     */

    setText(
        "enemyCount",
        enemiesDefeated
    );


    /* REFILL UI */

    const spellCooldownElement =
        document.getElementById(
            "spellCooldown"
        );


    if (
        spellCooldownElement
    ) {

        if (
            spellCooldown > 0
        ) {

            spellCooldownElement.style.display =
                "flex";

            spellCooldownElement.textContent =
                Math.ceil(
                    spellCooldown
                );

        }

        else {

            spellCooldownElement.style.display =
                "none";

        }

    }


    const refillText =
        document.getElementById(
            "mobileRefillText"
        );


    if (refillText) {

        if (
            spellCooldown > 0
        ) {

            refillText.textContent =
                Math.ceil(
                    spellCooldown
                ) + "s";

            mobileRefill.classList.add(
                "cooldown"
            );

        }

        else {

            refillText.textContent =
                "REFILL";

            mobileRefill.classList.remove(
                "cooldown"
            );

        }

    }


    /* SPACE HINT */

    const refillHintText =
        document.getElementById(
            "refillHintText"
        );


    if (refillHintText) {

        if (
            spellCooldown > 0
        ) {

            refillHintText.textContent =
                Math.ceil(
                    spellCooldown
                ) + "s";

        }

        else {

            refillHintText.textContent =
                "READY";

        }

    }


    updateSkillUI();

}


/* =========================================================
   SET TEXT
========================================================= */

function setText(
    id,
    value
) {

    const element =
        document.getElementById(id);


    if (element) {

        element.textContent =
            value;

    }

}


/* =========================================================
   SET BAR
========================================================= */

function setBar(
    id,
    value,
    max
) {

    const element =
        document.getElementById(id);


    if (
        !element ||
        max <= 0
    ) {

        return;

    }


    const percent =
        Math.max(
            0,
            Math.min(
                100,
                value /
                max *
                100
            )
        );


    element.style.width =
        percent + "%";

}


/* =========================================================
   SKILL UI
========================================================= */

function updateSkillUI() {

    for (
        const key in skills
    ) {

        const skill =
            skills[key];


        const cooldown =
            document.getElementById(
                key.toLowerCase() +
                "Cooldown"
            );


        if (cooldown) {

            if (
                skill.timer > 0
            ) {

                cooldown.style.display =
                    "flex";

                cooldown.textContent =
                    skill.timer.toFixed(
                        1
                    );

            }

            else {

                cooldown.style.display =
                    "none";

            }

        }


        const mobileCooldown =
            document.getElementById(
                "mobile" +
                key +
                "Cooldown"
            );


        if (
            mobileCooldown
        ) {

            if (
                skill.timer > 0
            ) {

                mobileCooldown.style.display =
                    "flex";

                mobileCooldown.textContent =
                    skill.timer.toFixed(
                        1
                    );

            }

            else {

                mobileCooldown.style.display =
                    "none";

            }

        }


        const manaElement =
            document.getElementById(
                key.toLowerCase() +
                "Mana"
            );


        if (
            manaElement
        ) {

            manaElement.textContent =
                skill.mana;

        }

    }


    /*
     * Mobile sprint button state.
     */

    if (mobileSprint) {

        if (
            sprintExhausted
        ) {

            mobileSprint.classList.add(
                "exhausted"
            );

        }

        else {

            mobileSprint.classList.remove(
                "exhausted"
            );

        }

    }

}


/* =========================================================
   DRAW MAP
========================================================= */

function drawMap() {

    ctx.fillStyle =
        "#4b8c4b";


    ctx.fillRect(
        0,
        0,
        WIDTH,
        HEIGHT
    );


    ctx.strokeStyle =
        "rgba(0,0,0,.08)";


    ctx.lineWidth = 1;


    const tileSize = 32;


    for (
        let x = 0;
        x < WIDTH;
        x += tileSize
    ) {

        for (
            let y = 0;
            y < HEIGHT;
            y += tileSize
        ) {

            ctx.strokeRect(
                x,
                y,
                tileSize,
                tileSize
            );

        }

    }


    ctx.strokeStyle =
        "#263b26";


    ctx.lineWidth = 8;


    ctx.strokeRect(
        4,
        4,
        WIDTH - 8,
        HEIGHT - 8
    );

}


/* =========================================================
   DRAW PLAYER
========================================================= */

function drawPlayer() {

    ctx.save();


    ctx.translate(
        player.x,
        player.y
    );


    ctx.fillStyle =
        "#287cff";


    ctx.fillRect(
        -player.size / 2,
        -player.size / 2,
        player.size,
        player.size
    );


    const eyeForwardX =
        Math.cos(
            player.facing
        ) * 5;


    const eyeForwardY =
        Math.sin(
            player.facing
        ) * 5;


    const eyeSideX =
        Math.cos(
            player.facing +
            Math.PI / 2
        ) * 4;


    const eyeSideY =
        Math.sin(
            player.facing +
            Math.PI / 2
        ) * 4;


    ctx.fillStyle =
        "white";


    ctx.beginPath();

    ctx.arc(
        eyeForwardX +
        eyeSideX,

        eyeForwardY +
        eyeSideY,

        3.5,

        0,
        Math.PI * 2
    );

    ctx.fill();


    ctx.beginPath();

    ctx.arc(
        eyeForwardX -
        eyeSideX,

        eyeForwardY -
        eyeSideY,

        3.5,

        0,
        Math.PI * 2
    );

    ctx.fill();


    ctx.fillStyle =
        "#111";


    ctx.beginPath();

    ctx.arc(
        eyeForwardX +
        eyeSideX +
        Math.cos(player.facing) *
        1.5,

        eyeForwardY +
        eyeSideY +
        Math.sin(player.facing) *
        1.5,

        1.5,

        0,
        Math.PI * 2
    );

    ctx.fill();


    ctx.beginPath();

    ctx.arc(
        eyeForwardX -
        eyeSideX +
        Math.cos(player.facing) *
        1.5,

        eyeForwardY -
        eyeSideY +
        Math.sin(player.facing) *
        1.5,

        1.5,

        0,
        Math.PI * 2
    );

    ctx.fill();


    /* SHIELD */

    if (
        player.blocking
    ) {

        ctx.strokeStyle =
            "#77c8ff";

        ctx.lineWidth = 6;


        ctx.beginPath();

        ctx.arc(
            0,
            0,
            28,

            player.facing -
            0.8,

            player.facing +
            0.8
        );

        ctx.stroke();

    }


    /* STUN */

    if (
        playerStunTimer > 0
    ) {

        ctx.strokeStyle =
            "#ffff00";

        ctx.lineWidth = 3;


        ctx.beginPath();

        ctx.arc(
            0,
            0,
            34,

            0,
            Math.PI * 2
        );

        ctx.stroke();

    }


    ctx.restore();

}


/* =========================================================
   DRAW ENEMIES
========================================================= */

function drawEnemies() {

    enemies.forEach(
        enemy => {

            if (
                enemy.type === "normal"
            ) {

                ctx.fillStyle =
                    "#e33434";


                ctx.fillRect(
                    enemy.x -
                    enemy.size / 2,

                    enemy.y -
                    enemy.size / 2,

                    enemy.size,
                    enemy.size
                );

            }


            if (
                enemy.type === "tank"
            ) {

                ctx.fillStyle =
                    "#8b2020";


                ctx.fillRect(
                    enemy.x -
                    enemy.size / 2,

                    enemy.y -
                    enemy.size / 2,

                    enemy.size,
                    enemy.size
                );


                ctx.strokeStyle =
                    "#ff7777";

                ctx.lineWidth = 3;


                ctx.strokeRect(
                    enemy.x -
                    enemy.size / 2 +
                    3,

                    enemy.y -
                    enemy.size / 2 +
                    3,

                    enemy.size - 6,

                    enemy.size - 6
                );

            }


            if (
                enemy.type === "ranged"
            ) {

                ctx.fillStyle =
                    "#f28c28";


                ctx.beginPath();


                ctx.moveTo(
                    enemy.x,

                    enemy.y -
                    enemy.size / 2
                );


                ctx.lineTo(
                    enemy.x +
                    enemy.size / 2,

                    enemy.y
                );


                ctx.lineTo(
                    enemy.x,

                    enemy.y +
                    enemy.size / 2
                );


                ctx.lineTo(
                    enemy.x -
                    enemy.size / 2,

                    enemy.y
                );


                ctx.closePath();

                ctx.fill();

            }


            /* BOSS */

            if (
                enemy.type === "boss"
            ) {

                ctx.save();


                ctx.translate(
                    enemy.x,
                    enemy.y
                );


                ctx.fillStyle =
                    "#8e44ad";


                ctx.beginPath();


                ctx.moveTo(
                    0,
                    -enemy.size / 2
                );


                ctx.lineTo(
                    enemy.size / 2,
                    0
                );


                ctx.lineTo(
                    0,
                    enemy.size / 2
                );


                ctx.lineTo(
                    -enemy.size / 2,
                    0
                );


                ctx.closePath();

                ctx.fill();


                ctx.strokeStyle =
                    "#d98cff";

                ctx.lineWidth = 3;

                ctx.stroke();


                ctx.restore();

            }


            /* EYES */

            const angle =
                Math.atan2(
                    player.y -
                    enemy.y,

                    player.x -
                    enemy.x
                );


            const eyeX =
                Math.cos(angle) * 5;


            const eyeY =
                Math.sin(angle) * 5;


            const sideX =
                Math.cos(
                    angle +
                    Math.PI / 2
                ) * 4;


            const sideY =
                Math.sin(
                    angle +
                    Math.PI / 2
                ) * 4;


            const eyeSize =
                enemy.type === "boss"
                    ? 4
                    : 3;


            ctx.fillStyle =
                "white";


            ctx.beginPath();

            ctx.arc(
                enemy.x +
                eyeX +
                sideX,

                enemy.y +
                eyeY +
                sideY,

                eyeSize,

                0,
                Math.PI * 2
            );

            ctx.fill();


            ctx.beginPath();

            ctx.arc(
                enemy.x +
                eyeX -
                sideX,

                enemy.y +
                eyeY -
                sideY,

                eyeSize,

                0,
                Math.PI * 2
            );

            ctx.fill();


            ctx.fillStyle =
                "#111";


            const pupilSize =
                enemy.type === "boss"
                    ? 2
                    : 1.5;


            ctx.beginPath();

            ctx.arc(
                enemy.x +
                eyeX +
                sideX +
                Math.cos(angle) *
                1.5,

                enemy.y +
                eyeY +
                sideY +
                Math.sin(angle) *
                1.5,

                pupilSize,

                0,
                Math.PI * 2
            );

            ctx.fill();


            ctx.beginPath();

            ctx.arc(
                enemy.x +
                eyeX -
                sideX +
                Math.cos(angle) *
                1.5,

                enemy.y +
                eyeY -
                sideY +
                Math.sin(angle) *
                1.5,

                pupilSize,

                0,
                Math.PI * 2
            );

            ctx.fill();


            /* BOSS WARNING */

            if (
                enemy.type === "boss" &&
                enemy.groundSkillWarning
            ) {

                const warningAlpha =
                    0.35 +
                    Math.sin(
                        performance.now() /
                        100
                    ) *
                    0.20;


                ctx.save();


                ctx.translate(
                    enemy.x,
                    enemy.y
                );


                ctx.rotate(
                    enemy.groundSkillAngle
                );


                ctx.strokeStyle =
                    `rgba(
                        255,
                        80,
                        80,
                        ${warningAlpha}
                    )`;


                ctx.lineWidth = 12;


                ctx.setLineDash([
                    15,
                    10
                ]);


                ctx.beginPath();


                ctx.moveTo(
                    0,
                    0
                );


                ctx.lineTo(
                    280,
                    0
                );


                ctx.stroke();


                ctx.setLineDash([]);


                ctx.restore();

            }


            /* BARRIER */

            if (
                enemy.type === "boss" &&
                enemy.barrierActive
            ) {

                ctx.strokeStyle =
                    "#b56cff";

                ctx.lineWidth = 5;


                ctx.beginPath();


                ctx.arc(
                    enemy.x,
                    enemy.y,
                    enemy.barrierRadius,

                    0,
                    Math.PI * 2
                );


                ctx.stroke();

            }


            /* HEALTH BAR */

            ctx.fillStyle =
                "#111";


            ctx.fillRect(
                enemy.x - 20,

                enemy.y -
                enemy.size / 2 -
                10,

                40,
                5
            );


            ctx.fillStyle =
                enemy.type === "boss"
                    ? "#b45cff"
                    : "#ff5555";


            ctx.fillRect(
                enemy.x - 20,

                enemy.y -
                enemy.size / 2 -
                10,

                40 *
                Math.max(
                    0,
                    enemy.hp /
                    enemy.maxHp
                ),

                5
            );

        }
    );

}


/* =========================================================
   FOOD
========================================================= */

function drawFood() {

    foods.forEach(
        food => {

            const alpha =
                Math.min(
                    1,
                    food.timer / 1
                );


            ctx.globalAlpha =
                alpha;


            ctx.fillStyle =
                food.fullRestore
                    ? "#ffd700"
                    : "#f4a261";


            ctx.beginPath();


            ctx.arc(
                food.x,
                food.y,
                food.size,

                0,
                Math.PI * 2
            );


            ctx.fill();


            ctx.strokeStyle =
                "#ffffff";

            ctx.lineWidth = 2;

            ctx.stroke();


            ctx.globalAlpha = 1;

        }
    );

}


/* =========================================================
   BOSS CRACKS
========================================================= */

function drawBossCracks() {

    bossCracks.forEach(
        crack => {

            const alpha =
                crack.timer /
                0.9;


            ctx.save();


            ctx.translate(
                crack.x,
                crack.y
            );


            ctx.rotate(
                crack.angle
            );


            ctx.strokeStyle =
                `rgba(
                    30,
                    10,
                    30,
                    ${alpha}
                )`;


            ctx.lineWidth =
                crack.width;


            ctx.beginPath();


            ctx.moveTo(
                0,
                0
            );


            ctx.lineTo(
                crack.length,
                0
            );


            ctx.stroke();


            ctx.lineWidth = 4;


            ctx.beginPath();


            ctx.moveTo(70, 0);
            ctx.lineTo(100, -20);

            ctx.moveTo(120, 0);
            ctx.lineTo(155, 22);

            ctx.moveTo(175, 0);
            ctx.lineTo(200, -18);


            ctx.stroke();


            ctx.restore();

        }
    );

}


/* =========================================================
   ATTACK RANGE
========================================================= */

function drawAttackRange() {

    const attackRange =
        110;


    ctx.beginPath();


    ctx.arc(
        player.x,
        player.y,
        attackRange,

        0,
        Math.PI * 2
    );


    ctx.strokeStyle =
        "rgba(255,255,255,.25)";


    ctx.lineWidth = 2;


    ctx.stroke();

}


/* =========================================================
   RICOCHET
========================================================= */

function drawRicochet() {

    if (
        ricochetTimer <= 0 ||
        ricochetTargets.length === 0
    ) {

        return;

    }


    ctx.strokeStyle =
        "#ffffff";


    ctx.lineWidth = 4;


    ctx.beginPath();


    let previousX =
        player.x;


    let previousY =
        player.y;


    ricochetTargets.forEach(
        enemy => {

            ctx.moveTo(
                previousX,
                previousY
            );


            ctx.lineTo(
                enemy.x,
                enemy.y
            );


            previousX =
                enemy.x;


            previousY =
                enemy.y;

        }
    );


    ctx.stroke();

}


/* =========================================================
   ULTIMATE
========================================================= */

function drawUltimateFlash() {

    if (
        ultimateFlashTimer <= 0
    ) {

        return;

    }


    const alpha =
        ultimateFlashTimer /
        0.35;


    ctx.fillStyle =
        `rgba(
            255,
            255,
            255,
            ${alpha}
        )`;


    ctx.fillRect(
        0,
        0,
        WIDTH,
        HEIGHT
    );

}


/* =========================================================
   PAUSE
========================================================= */

function drawPauseScreen() {

    if (
        !gamePaused
    ) {

        return;

    }


    ctx.fillStyle =
        "rgba(0,0,0,0.55)";


    ctx.fillRect(
        0,
        0,
        WIDTH,
        HEIGHT
    );


    ctx.fillStyle =
        "#ffffff";


    ctx.textAlign =
        "center";


    ctx.textBaseline =
        "middle";


    ctx.font =
        "bold 48px Arial";


    ctx.fillText(
        "PAUSED",

        WIDTH / 2,

        HEIGHT / 2 - 20
    );


    ctx.font =
        "20px Arial";


    ctx.fillText(
        "Press ESC to resume",

        WIDTH / 2,

        HEIGHT / 2 + 35
    );


    ctx.textAlign =
        "left";


    ctx.textBaseline =
        "alphabetic";

}


/* =========================================================
   UPDATE
========================================================= */

function update(dt) {

    if (
        !gameStarted ||
        gamePaused
    ) {

        return;

    }


    if (
        playerStunTimer <= 0
    ) {

        updatePlayer(dt);

    }

    else {

        /*
         * Player can still turn while stunned.
         */

        if (
            mobileInput.joystickX !== 0 ||
            mobileInput.joystickY !== 0
        ) {

            player.facing =
                Math.atan2(
                    mobileInput.joystickY,
                    mobileInput.joystickX
                );

        }

        else {

            player.facing =
                Math.atan2(
                    mouse.y -
                    player.y,

                    mouse.x -
                    player.x
                );

        }

    }


    updateEnemies(dt);

    updateStats(dt);

    updateCooldowns(dt);

    updateSpawning(dt);

    updateFood(dt);

    updateHUD();


    /* =====================================================
       DEATH
    ===================================================== */

    if (
        player.hp <= 0
    ) {

        player.hp = 0;

        gameStarted = false;


        /*
         * No refresh is required anymore.
         *
         * The player can press RESTART.
         */

        gamePaused = false;

    }

}


/* =========================================================
   DRAW
========================================================= */

function draw() {

    drawMap();

    drawBossCracks();

    drawAttackRange();

    drawFood();

    drawEnemies();

    drawPlayer();

    drawRicochet();

    drawUltimateFlash();

    drawPauseScreen();

}


/* =========================================================
   GAME LOOP
========================================================= */

function gameLoop(timestamp) {

    const dt =
        Math.min(
            0.05,

            (
                timestamp -
                lastTime
            ) / 1000
        );


    lastTime =
        timestamp;


    update(dt);

    draw();


    requestAnimationFrame(
        gameLoop
    );

}


/* =========================================================
   INITIALIZE
========================================================= */

updateSkillManaCosts();

updateHUD();


lastTime =
    performance.now();


requestAnimationFrame(
    gameLoop
);