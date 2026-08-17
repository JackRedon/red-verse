/* =================================
   RED VERSE CHARACTER DATABASE
================================= */

const characters = {

    jack: {

        title: "THE RED DIAMOND",
        name: "JACK REDON",
        alias: "RED",

        universe: "Red Universe",
        status: "Active",
        origin: "Earth",

        description:
            "Description to be added.",

        abilities: [
            "Pyrokinesis",
            "Teleportation"
        ],

        relationships: [
            {
                name: "Justin Redon",
                type: "Brother"
            }

        ],

        alternateVersions: [],

        affiliations: [
            "Affiliations to be added."
        ],

        aliases: [
            "Jack Redon",
            "Red"
	
	],

	trivia: [
            "Trivia to be added."

        ]

    },

    james: {

        title: "THE AID OF THE LIGHT",
        name: "JAMES GOLDSMAN",
        alias: "JAMES",

        universe: "Olympicus Universe",
        status: "Active",
        origin: "Vision, Olympicus",

        description:
            "Description to be added.",

        abilities: [
            "Abilities to be added"
        ],

        relationships: [],

        alternateVersions: [],

        affiliations: [],

        aliases: [
            "James Goldsman"
        ],

        trivia: []

    },


    jester: {

        title: "THE JESTER OF CHAOS",
        name: "JESTER DAWN",
        alias: "JESTER",

        universe: "Olympicus Universe",
        status: "Unknown",
        origin: "Vision, Olympicus",

        description:
            "Descriptiion to be added.",

        abilities: [
            "Abilities to be added"
        ],

        relationships: [],

        alternateVersions: [],

        affiliations: [],

        aliases: [
            "Jester Dawn",
            "Jester Icanthi"
        ],

        trivia: []

    },


    alex: {

        title: "THE PRINCESS ASSASSIN",
        name: "ALEXANDRIA SAKURO III.",
        alias: "SHINOBI",

        universe: "Oympicus Universe",
        status: "Active",
        origin: "Sevvera, Olympicus",

        description:
            "Description to be added.",

        abilities: [
            "Abilities to be added"
        ],

        relationships: [],

        alternateVersions: [],

        affiliations: [],

        aliases: [
            "Alex Sakuro",
            "Alexandria",
		"Shinobi"
        ],

        trivia: []

    },

    mack: {

        title: "THE TRAGIC BLADE",
        name: "MAC WHITLOCK",
        alias: "MAC",

        universe: "Olympicus Universe",
        status: "Active",
        origin: "Balik-Tanaw, Olympicus",

        description:
            "Description to be added.",

        abilities: [
		"Abilities to be added"
],

        relationships: [],

        alternateVersions: [],

        affiliations: [
            "Affiliations to be added."
        ],

        aliases: [
            "Mac"
	
	],

	trivia: [
            "Trivia to be added."

        ]

	}

};

/* =========================
   OPEN CHARACTER
========================= */

function openCharacter(characterID) {

    const character = characters[characterID];

    if (!character) {
        return;
    }


    document.getElementById("modalTitle").textContent =
        character.title;

    document.getElementById("modalName").textContent =
        character.name;

    document.getElementById("modalDescription").textContent =
        character.description;


    /* ABILITIES */

    const abilityList =
        document.getElementById("modalAbilities");

    abilityList.innerHTML = "";

    character.abilities.forEach(function(ability) {

        const item = document.createElement("li");

        item.textContent = ability;

        abilityList.appendChild(item);

    });


    /* EXTRA INFORMATION */

    let extraInformation =
        document.getElementById("extraInformation");


    if (!extraInformation) {

        extraInformation =
            document.createElement("div");

        extraInformation.id =
            "extraInformation";

        document
            .querySelector(".modal-content")
            .appendChild(extraInformation);

    }


    extraInformation.innerHTML = "";


    /* CHARACTER INFORMATION */

    extraInformation.innerHTML += `

        <div class="profile-section">

            <h3>CHARACTER INFORMATION</h3>

            <p>
                <strong>Universe:</strong>
                ${character.universe}
            </p>

            <p>
                <strong>Origin:</strong>
                ${character.origin}
            </p>

            <p>
                <strong>Status:</strong>
                ${character.status}
            </p>

        </div>

    `;


    /* RELATIONSHIPS */

    let relationshipsHTML = "";

    character.relationships.forEach(function(relationship) {

        relationshipsHTML += `

            <div class="relationship">

                <strong>${relationship.name}</strong>

                <span>${relationship.type}</span>

            </div>

        `;

    });


    extraInformation.innerHTML += `

        <div class="profile-section">

            <h3>RELATIONSHIPS</h3>

            ${
                relationshipsHTML ||
                "<p>No relationships documented.</p>"
            }

        </div>

    `;


    /* ALTERNATE VERSIONS */

    let versionsHTML = "";

    character.alternateVersions.forEach(function(version) {

        versionsHTML += `

            <div class="alternate-version">

                <h4>${version.name}</h4>

                <p>
                    <strong>${version.universe}</strong>
                </p>

                <p>
                    ${version.description}
                </p>

            </div>

        `;

    });


    extraInformation.innerHTML += `

        <div class="profile-section">

            <h3>ALTERNATE VERSIONS</h3>

            ${
                versionsHTML ||
                "<p>No alternate versions documented.</p>"
            }

        </div>

    `;


    /* AFFILIATIONS */

    let affiliationsHTML = "";

    character.affiliations.forEach(function(affiliation) {

        affiliationsHTML += `

            <span class="tag">
                ${affiliation}
            </span>

        `;

    });


    extraInformation.innerHTML += `

        <div class="profile-section">

            <h3>AFFILIATIONS</h3>

            <div class="tags">

                ${
                    affiliationsHTML ||
                    "<p>None documented.</p>"
                }

            </div>

        </div>

    `;


    /* ALIASES */

    let aliasesHTML = "";

    character.aliases.forEach(function(alias) {

        aliasesHTML += `

            <span class="tag">
                ${alias}
            </span>

        `;

    });


    extraInformation.innerHTML += `

        <div class="profile-section">

            <h3>ALIASES</h3>

            <div class="tags">

                ${aliasesHTML}

            </div>

        </div>

    `;


    /* TRIVIA */

    let triviaHTML = "";

    character.trivia.forEach(function(trivia) {

        triviaHTML += `
            <li>${trivia}</li>
        `;

    });


    extraInformation.innerHTML += `

        <div class="profile-section">

            <h3>TRIVIA</h3>

            <ul>

                ${
                    triviaHTML ||
                    "<li>No trivia documented.</li>"
                }

            </ul>

        </div>

    `;

/* MOVE BACK BUTTON TO THE BOTTOM */

const profileButtons = 

document.querySelector(".profile-buttons");

document
	.querySelector(".modal-content")
	.appendChild(profileButtons);


    /* OPEN MODAL */

    document
        .getElementById("characterModal")
        .classList.add("active");

    document.body.style.overflow = "hidden";

}



/* =========================
   CLOSE CHARACTER
========================= */

function closeCharacter() {

    document
        .getElementById("characterModal")
        .classList.remove("active");

    document.body.style.overflow = "auto";

}



/* =========================
   SEARCH
========================= */

function searchCharacters() {

    const search =
        document
            .getElementById("characterSearch")
            .value
            .toLowerCase();


    const cards =
        document.querySelectorAll(".character-card");


    cards.forEach(function(card) {

        const name =
            card
                .getAttribute("data-name")
                .toLowerCase();


        if (name.includes(search)) {

            card.style.display = "block";

        } else {

            card.style.display = "none";

        }

    });

}
	
/* =========================
   CLICK OUTSIDE MODAL
========================= */

document
    .getElementById("characterModal")
    .addEventListener("click", function(event) {

        if (event.target === this) {

            closeCharacter();

        }

    });



/* =========================
   ESCAPE KEY
========================= */

document.addEventListener("keydown", function(event) {

    if (event.key === "Escape") {

        closeCharacter();

    }

});



/* =========================
   LORE BUTTON
========================= */

function showLoreMessage() {

    alert(
        "The Red Verse Lore Encyclopedia is currently being constructed."
    );

}



/* =========================
   MAP BUTTON
========================= */

function openMap() {

    alert(
        "Your interactive Red Verse map will be connected here."
    );

}



/* =========================
   MOBILE MENU
========================= */

function toggleMenu() {

    const nav =
        document.querySelector(".navbar nav");


    if (nav.style.display === "flex") {

        nav.style.display = "none";

    } else {

        nav.style.display = "flex";

        nav.style.flexDirection = "column";

        nav.style.position = "absolute";

        nav.style.top = "75px";

        nav.style.right = "0";

        nav.style.background = "#080808";

        nav.style.padding = "25px";

    }

}

/* =========================
   STORY SORTING
========================= */

function sortStories(type, button) {

    const grid =
        document.getElementById("storyGrid");

    const cards =
        Array.from(
            grid.querySelectorAll(".story-card")
        );


    /* NORMAL */

    if (type === "normal") {

        cards.sort(function(a, b) {

            return (
                Number(a.dataset.published) -
                Number(b.dataset.published)
            );

        });

    }


    /* TIMELINE */

    else if (type === "timeline") {

        cards.sort(function(a, b) {

            return (
                Number(a.dataset.timeline) -
                Number(b.dataset.timeline)
            );

        });

    }


    /* A-Z */

    if (type === "az") {

        cards.sort(function(a, b) {

            return a.dataset.title.localeCompare(
                b.dataset.title
            );

        });

    }


    /* REBUILD GRID */

    cards.forEach(function(card) {

        grid.appendChild(card);

    });


    /* ACTIVE BUTTON */

    document
        .querySelectorAll(".story-filter")
        .forEach(function(filter) {

            filter.classList.remove("active");

        });


    button.classList.add("active");

}