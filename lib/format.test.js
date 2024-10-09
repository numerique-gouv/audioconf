const { expect } = require("chai")
const sinon = require("sinon")

const extractEmailDomain = require("./format")

describe("format", function() {

  describe("extractEmailDomain", () => {
    test("devrait retourner le domaine d\"une adresse email valide", () => {
        const email = "john.doe@example.com";
        const domain = extractEmailDomain(email);
        expect(domain).toBe("example.com");
    });

    test("devrait retourner le domaine d\"une adresse email académique", () => {
        const email = "student@university.edu";
        const domain = extractEmailDomain(email);
        expect(domain).toBe("university.edu");
    });

    test("devrait lever une erreur pour une adresse email sans @", () => {
        expect(() => {
            extractEmailDomain("invalidEmail");
        }).toThrow("Adresse email invalide");
    });

    test("devrait lever une erreur pour un domaine manquant", () => {
        expect(() => {
            extractEmailDomain("john.doe@");
        }).toThrow("Domaine email invalide");
    });

    test("devrait lever une erreur pour une chaîne vide", () => {
        expect(() => {
            extractEmailDomain(");
        }).toThrow("Adresse email invalide");
    });
});

})
