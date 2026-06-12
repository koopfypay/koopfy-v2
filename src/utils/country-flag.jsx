import { Lock } from "lucide-react";

export const renderCountryFlag = (country) => {
    switch (country) {
        case "BR":
            return <img src='../assets/icons/brazil.svg' alt="Brasil" className="h-6 w-6" />;
        case "CL":
            return <img src='../assets/icons/chile.svg' alt="Chile" className="h-6 w-6" />;
        case "MX":
            return <img src='../assets/icons/mexico.svg' alt="México" className="h-6 w-6" />;
        case "US":
            return <img src='../assets/icons/usa.svg' alt="Estados Unidos" className="h-6 w-6" />;
        case "AR":
            return <img src='../assets/icons/argentina.svg' alt="Argentina" className="h-6 w-6" />;
        case "CO":
            return <img src='../assets/icons/colombia.svg' alt="Colômbia" className="h-6 w-6" />;
        case "PE":
            return <img src='../assets/icons/peru.svg' alt="Peru" className="h-6 w-6" />;
        case "UY":
            return <img src='../assets/icons/uruguay.svg' alt="Uruguai" className="h-6 w-6" />;
        case "EC":
            return <img src='../assets/icons/ecuador.svg' alt="Equador" className="h-6 w-6" />;
        case "PY":
            return <img src='../assets/icons/paraguay.svg' alt="Paraguai" className="h-6 w-6" />;
        case "BO":
            return <img src='../assets/icons/bolivia.svg' alt="Bolívia" className="h-6 w-6" />;
        case "VE":
            return <img src='../assets/icons/venezuela.svg' alt="Venezuela" className="h-6 w-6" />;
        case "CA":
            return <img src='../assets/icons/canada.svg' alt="Canadá" className="h-6 w-6" />;
        case "ES":
            return <img src='../assets/icons/spain.svg' alt="Espanha" className="h-6 w-6" />;
        case "DE":
            return <img src='../assets/icons/germany.svg' alt="Alemanha" className="h-6 w-6" />;
        case "FR":
            return <img src='../assets/icons/france.svg' alt="França" className="h-6 w-6" />;
        case "IT":
            return <img src='../assets/icons/italy.svg' alt="Itália" className="h-6 w-6" />;
        case "NL":
            return <img src='../assets/icons/netherlands.svg' alt="Holanda" className="h-6 w-6" />;
        case "GB":
            return <img src='../assets/icons/united-kingdom.svg' alt="Reino Unido" className="h-6 w-6" />;
        case "CH":
            return <img src='../assets/icons/switzerland.svg' alt="Suíça" className="h-6 w-6" />;
        case "SE":
            return <img src='../assets/icons/sweden.svg' alt="Suécia" className="h-6 w-6" />;
        case "PT":
            return <img src='../assets/icons/portugal.svg' alt="Portugal" className="h-6 w-6" />;
        case "AU":
            return <img src='../assets/icons/australia.svg' alt="Austrália" className="h-6 w-6" />;
        case "JP":
            return <img src='../assets/icons/japan.svg' alt="Japão" className="h-6 w-6" />;
        case "AE":
            return <img src='../assets/icons/united-arab-emirates.svg' alt="Emirados Árabes" className="h-6 w-6" />;
        case "AT":
            return <img src='../assets/icons/austria.svg' alt="Áustria" className="h-6 w-6" />;
        case "BE":
            return <img src='../assets/icons/belgium.svg' alt="Bélgica" className="h-6 w-6" />;
        case "BG":
            return <img src='../assets/icons/bulgaria.svg' alt="Bulgária" className="h-6 w-6" />;
        case "CR":
            return <img src='../assets/icons/costa-rica.svg' alt="Costa Rica" className="h-6 w-6" />;
        case "HR":
            return <img src='../assets/icons/croatia.svg' alt="Croácia" className="h-6 w-6" />;
        case "DO":
            return <img src='../assets/icons/dominican-republic.svg' alt="República Dominicana" className="h-6 w-6" />;
        case "FI":
            return <img src='../assets/icons/finland.svg' alt="Finlândia" className="h-6 w-6" />;
        case "GR":
            return <img src='../assets/icons/greece.svg' alt="Grécia" className="h-6 w-6" />;
        case "HU":
            return <img src='../assets/icons/hungary.svg' alt="Hungria" className="h-6 w-6" />;
        case "IS":
            return <img src='../assets/icons/iceland.svg' alt="Islândia" className="h-6 w-6" />;
        case "IE":
            return <img src='../assets/icons/ireland.svg' alt="Irlanda" className="h-6 w-6" />;
        case "LU":
            return <img src='../assets/icons/luxembourg.svg' alt="Luxemburgo" className="h-6 w-6" />;
        case "NZ":
            return <img src='../assets/icons/new-zealand.svg' alt="Nova Zelândia" className="h-6 w-6" />;
        case "AM":
            return <img src='../assets/icons/armenia.svg' alt="Armênia" className="h-6 w-6" />;
        case "SV":
            return <img src='../assets/icons/el-salvador.svg' alt="El Salvador" className="h-6 w-6" />;
        case "EE":
            return <img src='../assets/icons/estonia.svg' alt="Estônia" className="h-6 w-6" />;
        case "GE":
            return <img src='../assets/icons/georgia.svg' alt="Geórgia" className="h-6 w-6" />;
        case "GT":
            return <img src='../assets/icons/guatemala.svg' alt="Guatemala" className="h-6 w-6" />;
        case "HN":
            return <img src='../assets/icons/honduras.svg' alt="Honduras" className="h-6 w-6" />;
        case "KW":
            return <img src='../assets/icons/kwait.svg' alt="Kuwait" className="h-6 w-6" />;
        case "MC":
            return <img src='../assets/icons/monaco.svg' alt="Mônaco" className="h-6 w-6" />;
        case "PA":
            return <img src='../assets/icons/panama.svg' alt="Panamá" className="h-6 w-6" />;
        case "PL":
            return <img src='../assets/icons/poland.svg' alt="Polônia" className="h-6 w-6" />;
        case "PR":
            return <img src='../assets/icons/puerto.svg' alt="Porto Rico" className="h-6 w-6" />;
        case "RO":
            return <img src='../assets/icons/romania.svg' alt="Romênia" className="h-6 w-6" />;
        case "SA":
            return <img src='../assets/icons/saudi-arabia.svg' alt="Arábia Saudita:" className="h-6 w-6" />;
        case "RS":
            return <img src='../assets/icons/serbia.svg' alt="Sérvia" className="h-6 w-6" />;
        case "SK":
            return <img src='../assets/icons/slovakia.svg' alt="Eslováquia" className="h-6 w-6" />;
        case "SI":
            return <img src='../assets/icons/slovenia.svg' alt="Eslovênia" className="h-6 w-6" />;
        case "DK":
            return <img src='../assets/icons/denmark.svg' alt="Dinamarca" className="h-6 w-6" />;
        default:
            return <Lock className="h-4 w-4 text-[#b3b3b3]" />;
    }
};
