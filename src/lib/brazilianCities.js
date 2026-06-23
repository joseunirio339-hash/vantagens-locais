// Base completa de cidades e bairros do Brasil para filtro de localidade
// Estrutura: { cidade: [bairros...] }

export const BRAZILIAN_CITIES = {
  // === REGIÃO NORTE ===
  'Rio Branco': ['Centro', 'Bosque', 'Estação Experimental', 'Plácido de Castro', 'Conjunto Tucumã', 'Cadeia Velha', '6 de Agosto', 'Base', 'Vila Acre', 'Abraão Alab'],
  'Macapá': ['Centro', 'Trem', 'Santa Rita', 'Buritizal', 'Jesus de Nazaré', 'Perpétuo Socorro', 'Congós', 'Paca', 'Laguinho', 'Zerão'],
  'Manaus': ['Centro', 'Adrianópolis', 'Aleixo', 'Chapada', 'Cidade Nova', 'Flores', 'Nossa Senhora das Graças', 'Parque 10', 'Ponta Negra', 'Tarumã', 'Vieiralves', 'Dom Pedro', 'São José'],
  'Belém': ['Nazaré', 'Umarizal', 'Batista Campos', 'Marco', 'Pedreira', 'Cidade Velha', 'Campina', 'Reduto', 'Cremação', 'Jurunas', 'Guamá', 'São Brás', 'Fátima'],
  'Porto Velho': ['Centro', 'Nova Porto Velho', 'Caiari', 'Olaria', 'Costa e Silva', 'Tiradentes', 'Embratel', 'Flodoaldo Pontes', 'São Cristóvão', 'Aeroclube'],
  'Boa Vista': ['Centro', 'São Vicente', 'Caçari', 'Mecejana', 'Pricumã', 'Liberdade', 'São Francisco', 'Santa Tereza', 'Aparecida', 'Paraviana'],
  'Palmas': ['Plano Diretor Norte', 'Plano Diretor Sul', 'Centro', 'Taquaralto', 'Aureny III', 'Aureny IV', 'Taquari', 'Santa Fé', 'Jardim Aureny III', 'Arno 71'],

  // === REGIÃO NORDESTE ===
  'Maceió': ['Ponta Verde', 'Jatiúca', 'Pajuçara', 'Mangabeiras', 'Cruz das Almas', 'Jaraguá', 'Centro', 'Farol', 'Serraria', 'Tabuleiro do Martins', 'Benedito Bentes', 'Stella Maris'],
  'Salvador': ['Barra', 'Rio Vermelho', 'Ondina', 'Pituba', 'Itaigara', 'Caminho das Árvores', 'Brotas', 'Costa Azul', 'Stiep', 'Graça', 'Vitória', 'Campo Grande', 'Federação', 'Imbuí', 'Cabula', 'Pernambués', 'Boca do Rio', 'Patamares', 'Cajazeiras', 'Pau da Lima', 'Liberdade', 'Bonfim', 'São Caetano', 'Valéria', 'Suburbana'],
  'Fortaleza': ['Aldeota', 'Meireles', 'Mucuripe', 'Praia de Iracema', 'Cocó', 'Papicu', 'Fátima', 'Dionísio Torres', 'Joaquim Távora', 'Montese', 'Centro', 'Varjota', 'Guararapes', 'Cambeba', 'Messejana', 'Parangaba', 'Maraponga', 'Barra do Ceará', 'Antônio Bezerra', 'Benfica', 'Vicente Pinzon'],
  'São Luís': ['Renascença', 'Ponta do Farol', 'São Francisco', 'Cohama', 'Calhau', 'Olho d\'Água', 'Turu', 'Cohafuma', 'Vinhais', 'Centro', 'Bequimão', 'Anil', 'Angelim'],
  'João Pessoa': ['Tambaú', 'Manaíra', 'Cabo Branco', 'Bessa', 'Altiplano', 'Jardim Oceania', 'Miramar', 'Bancários', 'Castelo Branco', 'Cristo Redentor', 'Torre', 'Expedicionários'],
  'Recife': ['Boa Viagem', 'Pina', 'Casa Forte', 'Graças', 'Jaqueira', 'Espinheiro', 'Aflitos', 'Parnamirim', 'Torre', 'Madalena', 'Derby', 'Santo Amaro', 'Boa Vista', 'Santo Antônio', 'São José', 'Cordeiro', 'Ipsep', 'Várzea', 'Ibura', 'Curado'],
  'Teresina': ['Jóquei', 'Fátima', 'Horto', 'São Cristóvão', 'Noivos', 'Ininga', 'Centro', 'Morada do Sol', 'Dirceu', 'Vermelha', 'Marquês', 'Santa Isabel'],
  'Natal': ['Ponta Negra', 'Petrópolis', 'Tirol', 'Lagoa Nova', 'Capim Macio', 'Neópolis', 'Candelária', 'Barro Vermelho', 'Areia Preta', 'Morro Branco', 'Alecrim', 'Centro'],
  'Aracaju': ['Atalaia', 'Jardins', 'Coroa do Meio', '13 de Julho', 'São José', 'Salgado Filho', 'Grageru', 'Farolândia', 'Luzia', 'Suíssa', 'Siqueira Campos'],
  'Feira de Santana': ['Centro', 'Kalilândia', 'Santa Mônica', 'Capuchinhos', 'Santo Antônio dos Prazeres', 'Ponto Central', 'Brasília', 'Tomba', 'Jardim Cruzeiro', 'Pampalona'],
  'Campina Grande': ['Centro', 'Catolé', 'Mirante', 'Alto Branco', 'Prata', 'José Pinheiro', 'Sandra Cavalcante', 'Liberdade', 'Bodocongó', 'Cruzeiro'],
  'Caruaru': ['Centro', 'Maurício de Nassau', 'Universitário', 'Indianópolis', 'Divinópolis', 'Kennedy', 'Salgado', 'Santa Rosa', 'Boa Vista', 'Petrópolis'],
  'Olinda': ['Casa Caiada', 'Bairro Novo', 'Rio Doce', 'Jardim Atlântico', 'Carmo', 'Varadouro', 'Sítio Histórico', 'Ouro Preto', 'Peixinhos', 'Águas Compridas'],
  'Jaboatão dos Guararapes': ['Piedade', 'Candeias', 'Barra de Jangada', 'Prazeres', 'Cavaleiro', 'Sucupira', 'Jordão', 'Centro', 'Vila Rica', 'Curado'],
  'Petrolina': ['Centro', 'Atrás da Banca', 'Areia Branca', 'Vila Eduardo', 'Cidade Universitária', 'Jardim Amazonas', 'Dom Avelar', 'Coelhos', 'Pedra do Bode'],
  'Juazeiro do Norte': ['Centro', 'Triângulo', 'Pirajá', 'Salesianos', 'Romeirão', 'São Miguel', 'Lagoa Seca', 'João Cabral', 'Timbaúbas', 'Novo Juazeiro'],
  'Ilhéus': ['Centro', 'Pontal', 'Malhado', 'Cidade Nova', 'Conquista', 'Jardim Savoia', 'Boa Vista', 'Nelson Costa', 'São Francisco', 'Teotônio Vilela'],
  'Porto Seguro': ['Centro', 'Arraial d\'Ajuda', 'Trancoso', 'Caraíva', 'Taperapuã', 'Mundai', 'Campo Verde', 'Cambolo', 'Baianão', 'Vila Parracho'],
  'Mossoró': ['Centro', 'Nova Betânia', 'Abolição', 'Alto de São Manoel', 'Santo Antônio', 'Doze Anos', 'Santa Delmira', 'Belo Horizonte', 'Boa Vista', 'Costa e Silva'],

  // === REGIÃO CENTRO-OESTE ===
  'Brasília': ['Asa Sul', 'Asa Norte', 'Lago Sul', 'Lago Norte', 'Sudoeste', 'Octogonal', 'Cruzeiro', 'Guará', 'Taguatinga', 'Águas Claras', 'Ceilândia', 'Samambaia', 'Planaltina', 'Sobradinho', 'Gama', 'Núcleo Bandeirante', 'Vicente Pires', 'Park Way', 'Jardim Botânico'],
  'Goiânia': ['Setor Bueno', 'Setor Marista', 'Setor Oeste', 'Jardim Goiás', 'Alto da Glória', 'Jardim América', 'Setor Sul', 'Setor Serrinha', 'Setor Pedro Ludovico', 'Setor Aeroporto', 'Setor Nova Suíça', 'Vila Nova', 'Setor Campinas', 'Setor Central', 'Setor Universitário', 'Jardim Atlântico'],
  'Cuiabá': ['Centro Norte', 'Centro Sul', 'Goiabeiras', 'Jardim das Américas', 'Jardim Cuiabá', 'Bosque da Saúde', 'Santa Rosa', 'Quilombo', 'Araés', 'Porto', 'CPA', 'Morada do Ouro', 'Jardim Itália', 'Alvorada', 'Coxipó'],
  'Campo Grande': ['Centro', 'Santa Fé', 'Jardim dos Estados', 'Vila Glória', 'Chácara Cachoeira', 'Carandá Bosque', 'Monte Castelo', 'Tiradentes', 'Amambaí', 'Parque dos Poderes', 'Vila Planalto', 'Aero Rancho', 'Universitário'],
  'Aparecida de Goiânia': ['Centro', 'Cidade Livre', 'Jardim Buriti Sereno', 'Setor Garavelo', 'Jardim Helvécia', 'Jardim Olímpico', 'Setor dos Afonsos', 'Vila Brasília', 'Polo Empresarial', 'Papillon Park'],
  'Anápolis': ['Centro', 'Jundiaí', 'Vila Góis', 'Maracanã', 'Jaiara', 'Alexandrina', 'Cidade Jardim', 'Vivian Parque', 'São Joaquim', 'Setor Sul'],
  'Rondonópolis': ['Centro', 'Vila Aurora', 'Jardim das Américas', 'Sagrada Família', 'Vila Birigui', 'Jardim Europa', 'Parque Sagrado', 'Vila Operária', 'Jardim Eldorado', 'Cidade Salmen'],

  // === REGIÃO SUDESTE ===
  'São Paulo': [
    'Jardins', 'Pinheiros', 'Vila Madalena', 'Itaim Bibi', 'Moema', 'Vila Olímpia', 'Brooklin', 'Morumbi', 'Perdizes', 'Pompeia', 'Higienópolis', 'Consolação',
    'Bela Vista', 'Liberdade', 'Santa Cecília', 'Barra Funda', 'Lapa', 'Vila Mariana', 'Aclimação', 'Saúde', 'Ipiranga', 'Mooca', 'Tatuapé', 'Belenzinho',
    'Brás', 'Pari', 'Bom Retiro', 'Sé', 'República', 'Vila Prudente', 'São Lucas', 'Sapopemba', 'Penha', 'Vila Matilde', 'Carrão', 'Aricanduva',
    'São Miguel Paulista', 'Itaquera', 'Guaianases', 'Cidade Tiradentes', 'Ermelino Matarazzo', 'Santana', 'Tucuruvi', 'Casa Verde', 'Limão',
    'Freguesia do Ó', 'Pirituba', 'Jaraguá', 'Brasilândia', 'Vila Sônia', 'Butantã', 'Rio Pequeno', 'Raposo Tavares', 'Campo Limpo', 'Capão Redondo',
    'Jardim São Luís', 'Vila Andrade', 'Santo Amaro', 'Campo Belo', 'Jabaquara', 'Cidade Ademar', 'Pedreira', 'Grajaú', 'Parelheiros', 'Marsilac',
    'Socorro', 'Interlagos', 'Cidade Dutra', 'Campo Grande', 'São Mateus', 'Iguatemi', 'José Bonifácio'
  ],
  'Rio de Janeiro': [
    'Copacabana', 'Ipanema', 'Leblon', 'Barra da Tijuca', 'Recreio dos Bandeirantes', 'Botafogo', 'Flamengo', 'Laranjeiras', 'Lagoa',
    'Jardim Botânico', 'Gávea', 'São Conrado', 'Tijuca', 'Vila Isabel', 'Maracanã', 'Grajaú', 'Méier', 'Engenho de Dentro', 'Jacarepaguá',
    'Taquara', 'Freguesia', 'Curicica', 'Campo Grande', 'Santa Cruz', 'Bangu', 'Realengo', 'Madureira', 'Irajá',
    'Penha', 'Olaria', 'Ramos', 'Bonsucesso', 'Ilha do Governador', 'Centro', 'Santa Teresa', 'Glória', 'Catete', 'Lapa',
    'São Cristóvão', 'Vila da Penha', 'Brás de Pina', 'Cordovil', 'Anchieta', 'Guadalupe', 'Marechal Hermes', 'Rocha Miranda', 'Coelho Neto',
    'Pavuna', 'Vila Kennedy', 'Jacarezinho', 'Manguinhos', 'Complexo do Alemão', 'Rocinha', 'Vidigal', 'Joá', 'Itanhangá'
  ],
  'Belo Horizonte': ['Savassi', 'Lourdes', 'Funcionários', 'Santo Antônio', 'São Pedro', 'Serra', 'Cruzeiro', 'Anchieta', 'Sion', 'Carmo', 'Santa Efigênia', 'Centro', 'Barro Preto', 'Cidade Nova', 'Floresta', 'Santa Tereza', 'Horto', 'Sagrada Família', 'Pampulha', 'Ouro Preto', 'Castelo', 'Mangabeiras', 'Belvedere', 'Buritis', 'Estoril', 'Jardim América', 'Caiçara', 'Nova Suíça', 'Gutierrez', 'Grajaú', 'Padre Eustáquio', 'Carlos Prates', 'Venda Nova', 'Venda Nova'],
  'Vitória': ['Praia do Canto', 'Barro Vermelho', 'Santa Lúcia', 'Enseada do Suá', 'Jardim da Penha', 'Mata da Praia', 'Jardim Camburi', 'Centro', 'Bento Ferreira', 'Praia do Suá', 'Santa Helena', 'Ilha do Boi', 'Itapuã', 'Goiabeiras'],
  'Niterói': ['Icaraí', 'São Francisco', 'Charitas', 'Jurujuba', 'Camboinhas', 'Piratininga', 'Itaipu', 'Santa Rosa', 'Ingá', 'Boa Viagem', 'Centro', 'Fonseca', 'Pendotiba', 'Piratininga'],
  'Guarulhos': ['Centro', 'Vila Augusta', 'Macedo', 'Gopoúva', 'Bom Clima', 'Cumbica', 'Bonsucesso', 'Pimentas', 'Jardim Presidente Dutra', 'Taboão'],
  'Campinas': ['Cambuí', 'Taquaral', 'Nova Campinas', 'Guanabara', 'Botafogo', 'Jardim Chapadão', 'Centro', 'Barão Geraldo', 'Sousas', 'Joaquim Egídio', 'Vila Industrial', 'Mansões Santo Antônio', 'Swift', 'Bonfim', 'Ponte Preta'],
  'Santos': ['Gonzaga', 'Boqueirão', 'Ponta da Praia', 'Aparecida', 'José Menino', 'Pompeia', 'Canal 1', 'Canal 3', 'Canal 4', 'Canal 6', 'Vila Belmiro', 'Encruzilhada', 'Marapé', 'Campo Grande', 'Embaré'],
  'São Bernardo do Campo': ['Centro', 'Baeta Neves', 'Rudge Ramos', 'Paulicéia', 'Vila Duzzi', 'Assunção', 'Taboão', 'Nova Petrópolis', 'Planalto', 'Jardim do Mar'],
  'Santo André': ['Centro', 'Campestre', 'Jardim', 'Vila Assunção', 'Vila Gilda', 'Santa Terezinha', 'Vila Valparaíso', 'Parque das Nações', 'Bairro Jardim', 'Bangu'],
  'Osasco': ['Centro', 'Vila Osasco', 'Presidente Altino', 'Bela Vista', 'Jaguaribe', 'Km 18', 'Quitaúna', 'Santo Antônio', 'Vila Campesina', 'Jardim Roberto'],
  'São José dos Campos': ['Centro', 'Jardim Aquarius', 'Vila Ema', 'Urbanova', 'Jardim das Indústrias', 'Jardim Satélite', 'Bosque dos Eucaliptos', 'Vila Adyanna', 'Parque Industrial', 'Campos de São José'],
  'Ribeirão Preto': ['Centro', 'Jardim Sumaré', 'Alto da Boa Vista', 'City Ribeirão', 'Nova Aliança', 'Jardim Paulista', 'Ribeirânia', 'Jardim Canadá', 'Jardim Irajá', 'Lagoinha'],
  'Sorocaba': ['Centro', 'Campolim', 'Jardim Santa Rosália', 'Jardim Faculdade', 'Vila Assis', 'Trujillo', 'Éden', 'Jardim Pagliato', 'Cerrado', 'Santa Terezinha'],
  'Uberlândia': ['Centro', 'Santa Mônica', 'Fundinho', 'Tibery', 'Saraiva', 'Santo Inácio', 'Jardim Karaíba', 'Morada da Colina', 'Jardim Finotti', 'Segismundo Pereira'],
  'Juiz de Fora': ['Centro', 'São Mateus', 'Cascatinha', 'Bom Pastor', 'São Pedro', 'Granbery', 'Paineiras', 'Aeroporto', 'Santa Terezinha', 'Mariano Procópio'],
  'Contagem': ['Centro', 'Eldorado', 'Industrial', 'Cidade Industrial', 'Riacho', 'Nova Contagem', 'Ressaca', 'Inconfidentes', 'Petrolândia', 'Sede'],
  'Serra': ['Centro', 'Laranjeiras', 'Jacaraípe', 'Manguinhos', 'Bairro de Fátima', 'Morada de Laranjeiras', 'Novo Horizonte', 'Feu Rosa', 'Jardim Limoeiro', 'Barcelona'],
  'Vila Velha': ['Praia da Costa', 'Itapuã', 'Itaparica', 'Coqueiral de Itaparica', 'Praia de Itapoã', 'Centro', 'Glória', 'Santa Paula', 'Ataíde', 'Barra do Jaba'],
  'São Gonçalo': ['Centro', 'Alcântara', 'Neves', 'Santa Luzia', 'Mutuá', 'Galo Branco', 'Itaúna', 'Jardim Catarina', 'Trindade', 'Rocha'],
  'Duque de Caxias': ['Centro', '25 de Agosto', 'Parque Lafaiete', 'Gramacho', 'Saracuruna', 'Xerém', 'Imbariê', 'Santa Cruz da Serra', 'Vila São Luís', 'Jardim Primavera'],
  'Nova Iguaçu': ['Centro', 'Posse', 'Comendador Soares', 'Austin', 'Cabuçu', 'Miguel Couto', 'Vila de Cava', 'Caonze', 'Prata', 'Jardim da Viga'],
  'Belford Roxo': ['Centro', 'Heliópolis', 'Areia Branca', 'São Bernardo', 'Nova Aurora', 'Lote XV', 'Jardim Redentor', 'Sargento Roncalli', 'Vila Medeiros', 'Parque dos Ferreiras'],
  'São João de Meriti': ['Centro', 'Vilar dos Teles', 'Coelho da Rocha', 'Agostinho Porto', 'Éden', 'Parque Analândia', 'Jardim Meriti', 'Grande Rio', 'Vila Rosali', 'Tomazinho'],
  'Bauru': ['Centro', 'Vila Universitária', 'Vila Cardia', 'Vila Falcão', 'Jardim Estoril', 'Vila São João', 'Parque Paulista', 'Jardim Europa', 'Jardim América', 'Vila Souto'],
  'Maringá': ['Centro', 'Zona 1', 'Zona 2', 'Zona 3', 'Zona 4', 'Zona 5', 'Zona 7', 'Zona 8', 'Vila Esperança', 'Jardim Alvorada'],
  'Londrina': ['Centro', 'Gleba Palhano', 'Jardim Cláudia', 'Jardim Petrópolis', 'Vila Brasil', 'Jardim Quebec', 'Jardim Shangri-lá', 'Cidade Industrial', 'Vila Recreio', 'Jardim Piza'],
  'Florianópolis': ['Centro', 'Agronômica', 'Trindade', 'Córrego Grande', 'Santa Mônica', 'Itacorubi', 'Lagoa da Conceição', 'Jurerê', 'Canasvieiras', 'Ingleses', 'Campeche', 'Rio Tavares', 'Estreito', 'Coqueiros', 'Abraão', 'Pantanal', 'Carvoeira', 'Saco dos Limões', 'Costeira do Pirajubaé', 'José Mendes'],
  'Joinville': ['Centro', 'América', 'Atiradores', 'Anita Garibaldi', 'Boa Vista', 'Bucarein', 'Costa e Silva', 'Glória', 'Iririú', 'Saguaçu'],
  'Blumenau': ['Centro', 'Velha', 'Vila Nova', 'Garcia', 'Fortaleza', 'Itoupava Seca', 'Água Verde', 'Bom Retiro', 'Victor Konder', 'Ponta Aguda'],
  'Caxias do Sul': ['Centro', 'São Pelegrino', 'Exposição', 'Panazzolo', 'Santa Catarina', 'Rio Branco', 'Pio X', 'Petrópolis', 'Bela Vista', 'Cidade Nova'],
  'Porto Alegre': ['Moinhos de Vento', 'Bela Vista', 'Mont\'Serrat', 'Boa Vista', 'Três Figueiras', 'Petrópolis', 'Rio Branco', 'Bom Fim', 'Independência', 'Floresta', 'Centro Histórico', 'Cidade Baixa', 'Menino Deus', 'Praia de Belas', 'Cristal', 'Tristeza', 'Ipanema', 'Vila Assunção', 'Jardim Europa', 'Higienópolis', 'Auxiliadora', 'Passo d\'Areia', 'Sarandi', 'Rubem Berta', 'Restinga', 'Partenon', 'Agronomia', 'Lomba do Pinheiro'],
  'Canoas': ['Centro', 'Marechal Rondon', 'Nossa Senhora das Graças', 'Mathias Velho', 'Estância Velha', 'Olaria', 'São José', 'Rio Branco', 'Fátima', 'Igara'],
  'Gravataí': ['Centro', 'Morada do Vale', 'Neópolis', 'Rincão', 'Nova Conquista', 'Parque dos Anjos', 'Dom Feliciano', 'São Vicente', 'Centro', 'São Geraldo'],
  'Novo Hamburgo': ['Centro', 'Hamburgo Velho', 'Ideal', 'Rio Branco', 'Canudos', 'São José', 'Santo Afonso', 'Rondônia', 'Boa Saúde', 'Primavera'],
  'Curitiba': ['Centro', 'Batel', 'Água Verde', 'Bigorrilho', 'Champagnat', 'Ecoville', 'Mercês', 'Ahú', 'Juvevê', 'Cabral', 'Hugo Lange', 'Alto da XV', 'Cristo Rei', 'Jardim Botânico', 'Rebouças', 'Portão', 'Santa Quitéria', 'Vila Izabel', 'Seminário', 'Boa Vista', 'Bacacheri', 'Tingui', 'Santa Felicidade', 'São Braz', 'Campina do Siqueira', 'Mossunguê', 'Campo Comprido', 'Cidade Industrial', 'Pinheirinho', 'Sítio Cercado', 'Bairro Novo', 'Uberaba', 'Xaxim', 'Boqueirão', 'Alto Boqueirão', 'Guaíra', 'Tatuquara'],
  'Pinhais': ['Centro', 'Weissópolis', 'Alto Tarumã', 'Maria Antonieta', 'Pineville', 'Vargem Grande', 'Atuba', 'Emiliano Perneta', 'Planta Karla', 'Estância Pinhais'],
  'São José dos Pinhais': ['Centro', 'Afonso Pena', 'Boneca do Iguaçu', 'Costeira', 'Cruzeiro', 'Águas Belas', 'Zacarias', 'Ipê', 'Quissisana', 'Cidade Jardim'],
  'Ponta Grossa': ['Centro', 'Oficinas', 'Órfãs', 'Uvaranas', 'Estrela', 'Neves', 'Contorno', 'Jardim Carvalho', 'Nova Rússia', 'Chapada'],
  'Cascavel': ['Centro', 'Maria Luiza', 'Universitário', 'Cancelli', 'Coqueiral', 'Neva', 'Pacaembu', 'Parque Verde', 'Santa Felicidade', 'FAG'],
  'Foz do Iguaçu': ['Centro', 'Vila A', 'Jardim das Américas', 'Jardim Central', 'Morumbi', 'Três Lagoas', 'Parque Presidente', 'Porto Meira', 'Campos do Iguaçu', 'Vila Portes'],

  // === OUTRAS CIDADES IMPORTANTES ===
  'Campos dos Goytacazes': ['Centro', 'Pelinca', 'Turfe Clube', 'Parque Leopoldina', 'Parque Califórnia', 'Jardim Carioca', 'Parque Tamandaré', 'Guarus', 'Parque Guarus', 'Parque Aldeia'],
  'Volta Redonda': ['Centro', 'Vila Santa Cecília', 'Aterrado', 'Jardim Amália', 'Retiro', 'Santo Agostinho', 'Conforto', 'Niterói', 'Jardim Paraíba', 'São Geraldo'],
  'Cabo Frio': ['Centro', 'Braga', 'Praia do Forte', 'São Bento', 'Peró', 'Ogiva', 'Jardim Caiçara', 'Gamboa', 'Jardim Esperança', 'Portinho'],
  'Armação dos Búzios': ['Centro', 'Praia de Geribá', 'Praia da Ferradura', 'Praia do Canto', 'Praia da Armação', 'Praia de Manguinhos', 'Praia da Tartaruga', 'Praia de João Fernandes', 'Praia Brava', 'Praia do Forno', 'Marina'],
  'Angra dos Reis': ['Centro', 'Japuíba', 'Jacuecanga', 'Monsuaba', 'Frade', 'Praia do Anil', 'Bracuí', 'Retiro', 'Praia Grande', 'Marinas'],
  'Paraty': ['Centro Histórico', 'Jabaquara', 'Pontal', 'Portal de Paraty', 'Patrimônio', 'Laranjeiras', 'Trindade', 'Praia do Sono', 'Cabo Velho', 'Ilha das Cobras'],
  'Petrópolis': ['Centro', 'Valparaíso', 'Quitandinha', 'Itaipava', 'Corrêas', 'Nogueira', 'Araras', 'Pedro do Rio', 'Bingen', 'Retiro'],
  'Nova Friburgo': ['Centro', 'Olaria', 'Cônego', 'Cordoeira', 'Braunes', 'Mury', 'Lumiar', 'São Pedro da Serra', 'Campo do Coelho', 'Amparo'],
  'Macaé': ['Centro', 'Cavaleiros', 'Imbetiba', 'Aroeira', 'Glória', 'Riviera Fluminense', 'Praia Campista', 'Granja dos Cavaleiros', 'Novo Cavaleiros', 'Lagomar'],
  'Teresópolis': ['Centro', 'Alto', 'Várzea', 'Agriões', 'São Pedro', 'Meudon', 'Granja Comary', 'Golf', 'Ermitage', 'Fazendinha'],
  'Resende': ['Centro', 'Campos Elíseos', 'Comercial', 'Jardim Brasília', 'Boa Vista', 'Vila Julieta', 'Alto dos Passos', 'Morada da Colina', 'Engenheiro Passos', 'Surubi'],
  'Itaboraí': ['Centro', 'Manilha', 'Esperança', 'Itambi', 'Retiro', 'Rio Várzea', 'Visconde de Itaboraí', 'Três Pontes', 'Grande Rio', 'Apolo'],
  'Nilópolis': ['Centro', 'Olinda', 'Nova Cidade', 'Cabral', 'Manuel Reis', 'Santos Dumont', 'Paiol de Pólvora', 'Bairro de Fátima', 'Nova Brasília', 'Fraternidade'],
  'Mesquita': ['Centro', 'Chatuba', 'Rocha Sobrinho', 'Santo Elias', 'Vila Emil', 'Cosmorama', 'Juscelino', 'Edson Passos', 'Santa Terezinha', 'Alto Uruguai'],
  'Magé': ['Centro', 'Piabetá', 'Fragoso', 'Mauá', 'Suruí', 'Guia de Pacobaíba', 'Raiz da Serra', 'Pau Grande', 'Santo Aleixo', 'Vila Inhomirim'],
  'Araruama': ['Centro', 'Praia Seca', 'Iguabinha', 'Vila Capri', 'Parque Hotel', 'Bananeiras', 'Praia do Tomé', 'Areal', 'Parque Mataruna', 'Coqueiral'],
  'Maricá': ['Centro', 'Araçatiba', 'Itaipuaçu', 'Inoã', 'Ponta Negra', 'Cordeirinho', 'Barra de Maricá', 'São José do Imbassaí', 'Bambuí', 'Itapeba'],
  'Saquarema': ['Centro', 'Itaúna', 'Bacaxá', 'Barra Nova', 'Vila', 'Boqueirão', 'Mombaça', 'Porto da Roça', 'Jacaré', 'Sampaio Corrêa'],

  // === CIDADES DO NORTE E NORDESTE ADICIONAIS ===
  'Imperatriz': ['Centro', 'Nova Imperatriz', 'Bacuri', 'Santa Luzia', 'São Salvador', 'Vila Vitória', 'Parque São José', 'Jardim São Luís', 'Vila Nova', 'Juçara'],
  'Vitória da Conquista': ['Centro', 'Candeias', 'Boa Vista', 'Recreio', 'Espírito Santo', 'Patagônia', 'Jurema', 'Alto Maron', 'Ibirapuera', 'Felícia'],
  'Itabuna': ['Centro', 'Góes Calmon', 'Conceição', 'Jardim Vitória', 'São Caetano', 'Fátima', 'Pontalzinho', 'Lomanto', 'Mangabinha', 'Nova Ferradas'],
  'Camaçari': ['Centro', 'Jardim Limoeiro', 'Vila de Abrantes', 'Guarajuba', 'Itacimirim', 'Arembepe', 'Barra do Jacuípe', 'Jauá', 'Bairro dos 46', 'Gravatá'],
  'Lauro de Freitas': ['Centro', 'Vilas do Atlântico', 'Portão', 'Itinga', 'Pitangueiras', 'Buraquinho', 'Parque São Paulo', 'Areia Branca', 'Vida Nova', 'Jardim Aeroporto'],
  'Parnamirim': ['Centro', 'Nova Parnamirim', 'Emaús', 'Rosa dos Ventos', 'Santos Reis', 'Monte Castelo', 'Passagem de Areia', 'Jardim Planalto', 'Liberdade', 'Parque das Árvores'],
  'Olinda': ['Casa Caiada', 'Bairro Novo', 'Rio Doce', 'Jardim Atlântico', 'Carmo', 'Varadouro', 'Sítio Histórico', 'Ouro Preto', 'Peixinhos', 'Águas Compridas'],
  'Caucaia': ['Centro', 'Icaraí', 'Tabuba', 'Cumbuco', 'Jurema', 'Pabussu', 'Parque Leblon', 'Marechal Rondon', 'Padre Romualdo', 'Araturi'],
  'Maracanaú': ['Centro', 'Jereissati', 'Piratininga', 'Mucunã', 'Pajuçara', 'Conjunto Industrial', 'Novo Maracanaú', 'Acaracuzinho', 'Parque Tijuca', 'Alto Alegre'],
  'Santa Maria': ['Centro', 'Camobi', 'Nossa Senhora de Lourdes', 'Nossa Senhora das Dores', 'Itararé', 'Passo d\'Areia', 'Juscelino Kubitschek', 'Urlândia', 'Patronato', 'Tancredo Neves'],
  'Pelotas': ['Centro', 'Areal', 'Fragata', 'Três Vendas', 'Laranjal', 'Porto', 'Barro Duro', 'Centro-Leste', 'Sítio Floresta', 'Jardim Europa'],
  'Rio Grande': ['Centro', 'Cassino', 'Parque Marinha', 'Cidade Nova', 'Vila Maria', 'São Miguel', 'Junção', 'Castelo Branco', 'Getúlio Vargas', 'Quinta'],
  'Passo Fundo': ['Centro', 'Vila Rodrigues', 'São Cristóvão', 'Petrópolis', 'Vila Luíza', 'Boqueirão', 'Vera Cruz', 'Santa Marta', 'Planaltina', 'Morada do Sol'],
  'Uruguaiana': ['Centro', 'São Miguel', 'Caboatã', 'Rubem Berta', 'Jardim do Sol', 'Santo Inácio', 'Cidade Nova', 'Nova Esperança', 'Ione Caetano', 'Emília'],
  'Bagé': ['Centro', 'Passo das Pedras', 'São Jorge', 'Morgado Rosa', 'Seival', 'Floresta', 'Santa Terezinha', 'Núcleo Habitacional Dunas', 'Getúlio Vargas', 'Industrial'],
  'Santana do Livramento': ['Centro', 'Prado', 'Armour', 'Wilson', 'Floresta', 'Carolina', 'Cidade de Rivera', 'Planalto', 'Tabatinga', 'Verde Plaza'],

  // === CIDADES DO CENTRO-OESTE ADICIONAIS ===
  'Sinop': ['Centro', 'Setor Industrial', 'Setor Comercial', 'Jardim das Palmeiras', 'Setor Residencial Sul', 'Jardim América', 'Vila Mariana', 'Setor São Cristóvão', 'Jardim Primavera', 'Setor de Chácaras'],
  'Barra do Garças': ['Centro', 'Vila Maria', 'Santo Antônio', 'Jardim dos Ipês', 'Jardim Amazônia', 'Vila Boa Vista', 'Nova Barra', 'Jardim Brasília', 'Vila Bela', 'Setor Universitário'],
  'Dourados': ['Centro', 'Vila Progresso', 'Jardim América', 'Vila Industrial', 'Parque das Nações', 'Jardim Água Boa', 'Vila Planalto', 'Jardim Caramuru', 'Jardim Flórida', 'Altos do Indaiá'],
  'Três Lagoas': ['Centro', 'Jardim das Acácias', 'Colinos', 'Santa Luzia', 'Jardim Cangalha', 'Vila Piloto', 'Bairro Interlagos', 'Parque São Carlos', 'Vila Nova', 'Jardim Dourados'],
  'Corumbá': ['Centro', 'Maria Leite', 'Popular Nova', 'Nova Corumbá', 'Dom Bosco', 'Generoso', 'Guatós', 'Popular Velha', 'Cervejaria', 'Aeroporto'],
  'Luziânia': ['Centro', 'Jardim Ingá', 'Parque Estrela Dalva', 'Campos Belos', 'Mansões de Recreio', 'Setor Sul', 'Vila São Paulo', 'Setor Fumal', 'Vila Esperança', 'Jardim Brasília'],
  'Águas Lindas de Goiás': ['Centro', 'Jardim Brasília', 'Setor 1', 'Setor 2', 'Setor 3', 'Setor 4', 'Setor 5', 'Setor 7', 'Setor 8', 'Jardim das Oliveiras'],
  'Valparaíso de Goiás': ['Centro', 'Valparaíso I', 'Valparaíso II', 'Parque Rio Branco', 'Jardim Oriente', 'Cruzeiro do Sul', 'Etapa A', 'Etapa B', 'Céu Azul', 'Marajó'],
  'Rio Verde': ['Centro', 'Jardim Goiás', 'Popular', 'Setor Oeste', 'Vila Maria', 'Setor Sul', 'Santa Cruz', 'Jardim América', 'Gameleira', 'Maranata'],
  'Caldas Novas': ['Centro', 'Turista I', 'Bandeirantes', 'Estância Itaici', 'Lagoa Quente', 'Parque Estância', 'Solar de Caldas', 'Jardins de Caldas', 'Nova Vila', 'Privê das Caldas'],

  // === CIDADES DE MINAS GERAIS ADICIONAIS ===
  'Betim': ['Centro', 'Angola', 'Icaraí', 'Cidade Verde', 'Parque das Indústrias', 'Imbiruçu', 'Teresópolis', 'PTB', 'Citrolândia', 'Jardim Teresópolis'],
  'Uberaba': ['Centro', 'São Benedito', 'Fabrício', 'Mercês', 'Santa Maria', 'Recreio dos Bandeirantes', 'Conjunto Uberaba', 'Parque das Américas', 'Jardim Triângulo', 'Vila Olímpica'],
  'Montes Claros': ['Centro', 'Ibituruna', 'Major Prates', 'Santo Antônio', 'Todos os Santos', 'Vila Exposição', 'Cidade Nova', 'Vila Brasília', 'Canelas', 'Independência'],
  'Divinópolis': ['Centro', 'Niterói', 'São Judas Tadeu', 'Bom Pastor', 'Porto Velho', 'Catalão', 'Esplanada', 'Santa Rosa', 'São José', 'São Caetano'],
  'Sete Lagoas': ['Centro', 'Canaã', 'Boa Vista', 'Santa Luzia', 'Cidade de Deus', 'Itapoã', 'Jardim Europa', 'Nova Cidade', 'Morro do Clube', 'São Francisco'],
  'Ipatinga': ['Centro', 'Cidade Nobre', 'Horto', 'Cariru', 'Ideal', 'Bom Jardim', 'Vila Celeste', 'Novo Cruzeiro', 'Veneza', 'Bethânia'],
  'Governador Valadares': ['Centro', 'São Paulo', 'São Pedro', 'Lourdes', 'Vila Bretãs', 'Ilha dos Araújos', 'Morada do Vale', 'Jardim Pérola', 'Planalto', 'Santa Rita'],

  // === CIDADES DO PARANÁ ADICIONAIS ===
  'Colombo': ['Centro', 'Guaraituba', 'Rio Verde', 'São Gabriel', 'Mauá', 'Guarani', 'Roça Grande', 'Atuba', 'Palmital', 'Osasco'],
  'Araucária': ['Centro', 'Fazenda Velha', 'Porto das Laranjeiras', 'Costeira', 'Capela Velha', 'Tindiquera', 'Campina da Barra', 'Bariguí', 'Sabará', 'Passaúna'],
  'Londrina (PR)': ['Centro', 'Gleba Palhano', 'Jardim Cláudia', 'Jardim Petrópolis', 'Vila Brasil', 'Jardim Quebec', 'Jardim Shangri-lá', 'Cidade Industrial', 'Vila Recreio', 'Jardim Piza'],
  'Maringá (PR)': ['Centro', 'Zona 1', 'Zona 2', 'Zona 3', 'Zona 4', 'Zona 5', 'Zona 7', 'Zona 8', 'Vila Esperança', 'Jardim Alvorada'],

  // === CIDADES DE SANTA CATARINA ADICIONAIS ===
  'São José (SC)': ['Centro', 'Campinas', 'Kobrasol', 'Praia Comprida', 'Barreiros', 'Flor de Nápolis', 'Forquilhinhas', 'Picadas do Sul', 'Serraria', 'Roçado'],
  'Itajaí': ['Centro', 'Fazenda', 'Cordeiros', 'São Vicente', 'Barra do Rio', 'Praia Brava', 'Cabeçudas', 'São João', 'Vila Operária', 'Dom Bosco'],
  'Balneário Camboriú': ['Centro', 'Praia dos Amores', 'Barra Sul', 'Pioneiros', 'Estados', 'Nações', 'Ariribá', 'Nova Esperança', 'Vila Real', 'Taquaras'],
  'Chapecó': ['Centro', 'São Cristóvão', 'Efapi', 'Presidente Médici', 'Seminário', 'Passo dos Fortes', 'Quinta dos Portugueses', 'Maria Goretti', 'Engenho Braun', 'Líder'],
  'Criciúma': ['Centro', 'Próspera', 'Santa Luzia', 'São Luiz', 'Operária Nova', 'Pio Corrêa', 'Comerciário', 'Michel', 'Quarta Linha', 'Mina Brasil'],
  'Jaraguá do Sul': ['Centro', 'Czerniewicz', 'Vila Nova', 'Barra do Rio Cerro', 'Chico de Paulo', 'João Pessoa', 'Vila Rau', 'Nova Brasília', 'Ilha da Figueira', 'Amizade'],
  'Palhoça': ['Centro', 'Ponte do Imaruim', 'Jardim Eldorado', 'Bela Vista', 'Praia de Fora', 'Pinheira', 'Guarda do Embaú', 'Enseada de Brito', 'Barra do Aririú', 'Pedra Branca'],
  'Lages': ['Centro', 'Coral', 'Guadalupe', 'Santa Helena', 'São Cristóvão', 'Sagrado Coração de Jesus', 'Vila Nova', 'Centenário', 'Caravágio', 'Bela Vista'],

  // === CIDADES DO ESPÍRITO SANTO ADICIONAIS ===
  'Cariacica': ['Centro', 'Campo Grande', 'Jardim América', 'São Geraldo', 'Itacibá', 'Porto de Santana', 'Rio Branco', 'Santa Fé', 'Vila Capixaba', 'Nova Canaã'],
  'Linhares': ['Centro', 'Três Barras', 'Aviso', 'Shell', 'Interlagos', 'Lagoa Park', 'Juparanã', 'Canivete', 'Movelar', 'Boa Vista'],
  'Colatina': ['Centro', 'Maria das Graças', 'Vila Lenira', 'São Vicente', 'Esplanada', 'Santa Margarida', 'São Silvano', 'Bairro Operário', 'Lacê', 'Honório Fraga'],
  'Guarapari': ['Centro', 'Praia do Morro', 'Muquiçaba', 'Santa Mônica', 'Kubitscheck', 'Nova Guarapari', 'Setiba', 'Peracanga', 'Enseada Azul', 'Meaípe'],
};

export function getAllCities() {
  return Object.keys(BRAZILIAN_CITIES).sort();
}

export function getNeighborhoods(city) {
  if (!city) return [];
  return BRAZILIAN_CITIES[city] || [];
}