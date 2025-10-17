export interface PlaceCategory {
  key: string;
  label: string;
  tags: { key: string; label: string }[];
}

export const placeCategories: PlaceCategory[] = [
  {
    key: 'nature',
    label: '🌿 Příroda',
    tags: [
      { key: 'natural=peak', label: 'Vrchol hory' },
      { key: 'waterway=waterfall', label: 'Vodopády' },
      { key: 'natural=beach', label: 'Pláž' },
      { key: 'natural=wetland', label: 'Mokřady' },
      { key: 'leisure=nature_reserve', label: 'Přírodní rezervace' },
      { key: 'tourism=viewpoint', label: 'Vyhlídka' },
      { key: 'tourism=picnic_site', label: 'Piknikové místo' },
      { key: 'natural=cave_entrance', label: 'Jeskyně' },
      { key: 'natural=geyser', label: 'Gejzír' },
      { key: 'natural=cliff', label: 'Útes' },
      { key: 'natural=valley', label: 'Údolí' },
      { key: 'natural=volcano', label: 'Sopka' }

    ]
  },
  {
    key: 'landmarks',
    label: '🏰 Památky a historie',
    tags: [
      { key: 'historic=castle', label: 'Hrad/zámek' },
      { key: 'historic=ruins', label: 'Zřícenina' },
      { key: 'historic=monument', label: 'Památka' },
      { key: 'historic=archaeological_site', label: 'Archeologické naleziště' },
      { key: 'historic=church', label: 'Kostel' },
      { key: 'tourism=museum', label: 'Muzeum' },
      { key: 'historic=fort', label: 'Pevnost' },
      { key: 'historic=battlefield', label: 'Bojiště' },
      { key: 'historic=manor', label: 'Panství' },
      { key: 'historic=lighthouse', label: 'Maják' },
      { key: 'historic=ship', label: 'Historická loď' },
      { key: 'historic=building', label: 'Staré budovy' }

    ]
  },
  {
    key: 'entertainment',
    label: '🎭 Zábava a volný čas',
    tags: [
      { key: 'leisure=park', label: 'Park' },
      { key: 'leisure=water_park', label: 'Aquapark' },
      { key: 'leisure=amusement_arcade', label: 'Herna' },
      { key: 'leisure=theme_park', label: 'Zábavní park' },
      { key: 'leisure=sports_centre', label: 'Sportovní centrum' },
      { key: 'leisure=sports_hall', label: 'Sportovní hala' },
      { key: 'leisure=stadium', label: 'Stadion' },
      { key: 'tourism=attraction', label: 'Obecná turistická atrakce' },
      { key: 'tourism=theme_park', label: 'Zábavní park' },
      { key: 'tourism=zoo', label: 'Zoo' },
      { key: 'tourism=animal_park', label: 'Zoopark' },
      { key: 'tourism=wildlife_park', label: 'Přírodní park' },
      { key: 'amenity=cinema', label: 'Kino' },
      { key: 'amenity=theatre', label: 'Divadlo' },
      { key: 'amenity=bowling_alley', label: 'Bowling' },
      { key: 'amenity=nightclub', label: 'Noční klub' },
      { key: 'tourism=aquarium', label: 'Akvárium' },
      { key: 'tourism=yes', label: 'Turistická cesta' },
      { key: 'leisure=miniature_golf', label: 'Minigolf' },
      { key: 'leisure=adventure_park ', label: 'Lanový park' },
      { key: 'leisure=escape_game', label: 'Lanový park' },

    ]
  },
  {
    key: 'dining',
    label: '🍽️ Stravování',
    tags: [
      { key: 'amenity=restaurant', label: 'Restaurace' },
      { key: 'amenity=cafe', label: 'Kavárna' },
      { key: 'amenity=fast_food', label: 'Fast food' },
      { key: 'amenity=bar', label: 'Bar' },
      { key: 'amenity=pub', label: 'Hospoda' },
      { key: 'amenity=biergarten', label: 'Pivní zahrádka' },
      { key: 'amenity=food_court', label: 'Rychlé občerstvení' },
      { key: 'amenity=ice_cream', label: 'Zmrzlinárna' },
      { key: 'shop=pastry', label: 'Cukrárna' },
      { key: 'shop=chocolate', label: 'Čokoládovna' },
      { key: 'shop=tea', label: 'Čajovna' },
      { key: 'shop=coffee', label: 'Obchod s kávou' },
      { key: 'shop=wine', label: 'Vinotéka' }
    ]
  },
  {
    key: 'accommodation',
    label: '🏨 Ubytování',
    tags: [
      { key: 'tourism=hotel', label: 'Hotel' },
      { key: 'tourism=motel', label: 'Motel' },
      { key: 'tourism=guest_house', label: 'Penzion' },
      { key: 'tourism=hostel', label: 'Hostel' },
      { key: 'tourism=camp_site', label: 'Kemp' },
      { key: 'tourism=chalet', label: 'Chata' },
      { key: 'tourism=resort', label: 'Resort' },
      { key: 'tourism=apartment', label: 'Apartmán' },
      { key: 'tourism=bed_and_breakfast', label: 'Bed & Breakfast' },
      { key: 'tourism=farmstay', label: 'Agroturistika' },
      { key: 'tourism=caravan_site', label: 'Karavanové stání' },
      { key: 'tourism=lodge', label: 'Horská bouda' },
      { key: 'tourism=boatel', label: 'Hausbót' },
      { key: 'tourism=alpine_hut', label: 'Horská chata' }
    ]
  },
  {
    key: 'transport',
    label: '🚆 Doprava a služby',
    tags: [
      { key: 'amenity=fuel', label: 'Čerpací stanice' },
      { key: 'amenity=charging_station', label: 'Nabíjecí stanice' },
      { key: 'amenity=car_rental', label: 'Půjčovna aut' },
      { key: 'amenity=bicycle_rental', label: 'Půjčovna kol' },
      { key: 'amenity=bus_station', label: 'Autobusové nádraží' },
      { key: 'amenity=taxi', label: 'Stanoviště taxi' },
      { key: 'railway=station', label: 'Železniční stanice' },
      { key: 'aeroway=aerodrome', label: 'Letiště' },
      { key: 'amenity=car_sharing', label: 'Sdílení aut' },
      { key: 'amenity=ferry_terminal', label: 'Přístaviště trajektu' },
      { key: 'railway=tram_stop ', label: 'Tramvajová zastávka' }
    ]
  },
  {
    key: 'health',
    label: '🏥 Zdraví',
    tags: [
      { key: 'amenity=hospital', label: 'Nemocnice' },
      { key: 'amenity=clinic', label: 'Klinika' },
      { key: 'amenity=pharmacy', label: 'Lékárna' },
      { key: 'amenity=dentist', label: 'Zubař' },
      { key: 'amenity=doctors', label: 'Doktor' },
      { key: 'amenity=spa', label: 'Lázně' },
      { key: 'leisure=fitness_centre', label: 'Fitness centrum' },
      { key: 'leisure=swimming_pool', label: 'Plavecký bazén' }
    ]
  },
  {
    key: 'shopping',
    label: '🛍️ Nakupování',
    tags: [
      { key: 'shop=supermarket', label: 'Supermarket' },
      { key: 'shop=mall', label: 'Obchodní centrum' },
      { key: 'shop=convenience', label: 'Večerka' },
      { key: 'shop=bakery', label: 'Pekárna' },
      { key: 'shop=butcher', label: 'Řeznictví' },
      { key: 'shop=clothes', label: 'Obchod s oblečením' },
      { key: 'shop=sports', label: 'Sportovní obchod' },
      { key: 'shop=gift', label: 'Dárkový obchod' },
      { key: 'shop=jewelry', label: 'Klenotnictví' },
      { key: 'shop=department_store', label: 'Obchodní dům' },
      { key: 'shop=general', label: 'Obchody' },
      { key: 'shop=marketplace', label: 'Tržiště' },
      { key: 'shop=electronics', label: 'Elektronika' },
      { key: 'shop=bookstore', label: 'Knihkupectví' },
      { key: 'shop=sports', label: 'Sportovní potřeby' },
      { key: 'shop=outdoor', label: 'Outdoorové vybavení' }
    ]
  },
  {
    key: 'sports',
    label: '⚽ Sportovní aktivity',
    tags: [
      { key: 'leisure=stadium', label: 'Stadion' },
      { key: 'leisure=sports_centre', label: 'Sportovní centrum' },
      { key: 'leisure=sports_hall', label: 'Sportovní hala' },
      { key: 'leisure=fitness_centre', label: 'Fitness centrum' },
      { key: 'leisure=swimming_pool', label: 'Plavecký bazén' },
      { key: 'leisure=tennis_court', label: 'Tenisový kurt' },
      { key: 'leisure=golf_course', label: 'Golfové hřiště' },
      { key: 'leisure=horse_riding', label: 'Jezdecký areál' },
      { key: 'leisure=bowling_alley', label: 'Bowling' },
      { key: 'leisure=ice_rink', label: 'Kluziště' },
      { key: 'leisure=skatepark', label: 'Skatepark' },
      { key: 'sport=skiing', label: 'Lyžařský areál' },
      { key: 'sport=snowboard', label: 'Snowboardový park' },
      { key: 'sport=climbing', label: 'Horolezectví' },
      { key: 'sport=surfing', label: 'Surfování' },
      { key: 'sport=scuba_diving', label: 'Potápění' },
      { key: 'sport=cycling', label: 'Cyklistika' },
      { key: 'sport=running', label: 'Běžecké trasy' },
      { key: 'sport=archery', label: 'Lukostřelba' },
      { key: 'sport=shooting', label: 'Střelnice' },
      { key: 'sport=fishing', label: 'Rybářské místo' },
      { key: 'leisure=miniature_golf', label: 'Minigolf' },
    ]
  },
  {
    key: 'religion',
    label: '⛪ Náboženství',
    tags: [
      { key: 'amenity=place_of_worship', label: 'Místo k bohoslužbě' },
      { key: 'building=church', label: 'Kostel' },
      { key: 'building=cathedral', label: 'Katedrála' },
      { key: 'building=chapel', label: 'Kaple' },
      { key: 'building=basilica', label: 'Bazilika' },
      { key: 'building=monastery', label: 'Klášter' },
      { key: 'building=mosque', label: 'Mešita' },
      { key: 'building=synagogue', label: 'Synagoga' },
      { key: 'building=temple', label: 'Chrám' },
      { key: 'building=shrine', label: 'Svatyně' },
      { key: 'historic=monastery', label: 'Historický klášter' },
      { key: 'religion=christian', label: 'Křesťanské místo' },
      { key: 'religion=islamic', label: 'Islámské místo' },
      { key: 'religion=jewish', label: 'Židovské místo' },
      { key: 'religion=buddhist', label: 'Buddhistické místo' },
      { key: 'religion=hindu', label: 'Hinduistické místo' },
      { key: 'religion=shinto', label: 'Šintoistické místo' },
      { key: 'religion=taoist', label: 'Taoistické místo' },
      { key: 'religion=sikh', label: 'Sikhské místo' },
      { key: 'historic=cemetery', label: 'Historický hřbitov' },
      { key: 'amenity=cemetery', label: 'Hřbitov' }
    ]
  },
];
