# Mempool Sentinel Pro

Dashboard Bitcoin professionnel pour la surveillance temps réel du mempool, des frais, et la construction de transactions.

## Fonctionnalités

### Surveillance Temps Réel
- **Frais du marché** : Recommandations par priorité avec tendances
- **Mempool** : Utilisation, débit, congestion, temps estimé de vidage
- **Blocs** : Dernier bloc miné avec détails du pool
- **Graphique** : Historique des frais (120 points)

### Métriques Réseau
- **Hashrate** et difficulté actuelle
- **Ajustement de difficulté** : Progression et estimation
- **Prix BTC** : USD, EUR et autres devises
- **Distribution des frais** : Histogramme du mempool

### Outils de Transaction
- **Estimateur rapide** : Calcul des frais par taille de tx
- **Constructeur Standard** : Sélection UTXO, fee personnalisé, PSBT
- **RBF** : Replace-By-Fee avec récupération de tx
- **CPFP** : Child-Pays-For-Parent avec calcul de package
- **Outils de calcul** : Estimateur, calculateur RBF, calculateur CPFP

### Surveillance
- **Alertes** : Frais élevés, nouveaux blocs, mempool critique
- **Suivi d'adresses** : Transactions entrantes/sortantes en temps réel
- **Notifications toast** : Alertes visuelles

## Architecture

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx
│   ├── page.tsx           # Dashboard principal
│   └── globals.css        # Styles Tailwind
├── components/            # 20 composants UI
├── hooks/                 # useMempoolWebSocket, useAddressTracker
├── lib/                   # Client API, utilities
└── types/                 # Types TypeScript
```

## Installation

```bash
npm install
npm run dev
```

## Variables d'environnement

```env
NEXT_PUBLIC_MEMPOOL_API=https://mempool.bitdevsyde.org
NEXT_PUBLIC_MEMPOOL_WS=wss://mempool.bitdevsyde.org/api/v1/ws
```

## API Utilisées

### REST
- `GET /api/v1/fees/recommended`
- `GET /api/v1/fees/mempool-blocks`
- `GET /api/mempool`
- `GET /api/v1/blocks`
- `GET /api/v1/block/:hash`
- `GET /api/tx/:txid`
- `GET /api/address/:address`
- `GET /api/address/:address/utxo`
- `GET /api/v1/difficulty-adjustment`
- `GET /api/v1/mining/hashrate/3d`
- `GET /api/v1/prices`

### WebSocket
- `wss://mempool.bitdevsyde.org/api/v1/ws`
- Canaux: blocks, stats, mempool-blocks, live-2h-chart
- Track-addresses pour surveillance
