//must have only letters (no accents)
const badwordsWithExactMatch = [
    'Anal',
    'Cu',
    'Imbecil',
    'Podre',
    'Pora',
    'Tapuru',
    'Zona',
    'Travesti'
]

const badwordsToConcat = [
    'Abort',
    'Aidetic',
    'Analfabet',
    'Arrombad',
    'Asqueros',
    'Bocet',
    'Bucet',
    'Bosset',
    'Bost',
    'Busset',
    'Cadel',
    'Cuz',
    'Deposit',
    'Esporrad',
    'Esperm',
    'Estrupador',
    'Fracassad',
    'Fudid',
    'Idiot',
    'Iscrot',
    'Jument',
    'Marmit',
    'Mijad',
    'Mij',
    'Mocre',
    'Mocrei',
    'Necrosad',
    'Nojent',
    'Noj',
    'Otari',
    'Piranh',
    'Piroc',
    'Pornit',
    'Prostitut',
    'Punhet',
    'Put',
    'Rabud',
    'Tarad',
    'Travec',
    'Vagabund',
    'Vagin',
    'Vead',
    'Viad',
    'Xan',
    'Xavasc',
    'Xererec',
    'Xexec',
    'Xochot',
    'Xot',
    'Xoxot'
]

const variations = [
    'a',
    'o',
    'ada',
    'adas',
    'ao',
    'aos',
    'as',
    'azinha',
    'azinhas',
    'azona',
    'azonas',
    'inha',
    'inhas',
    'oes',
    'ona',
    'onas',
    'uda',
    'udas',
    'udo',
    'udos'
]

export default [
    badwordsWithExactMatch,
    badwordsToConcat.map(word => {
        return [
            word,
            variations
        ]
    })
]