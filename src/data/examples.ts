// Author: Vincy SHI
// Email: vincy@vincy1230.net
//
// OpenFold3 官方文档「输入格式参考」页面 (Section 5) 提供的全部 7 份示例
// query JSON，逐字内嵌（未做任何字段改写）。用途：
//   1. PresetSelector 的"加载示例"数据源；
//   2. of3Serialize 的回归测试基准（见 src/utils/__tests__）。
// 来源：https://openfold-3.readthedocs.io/en/latest/input_format_reference.html

import type { Of3Input } from '@/types/of3'

export interface Of3Example {
  id: string
  input: Of3Input
}

const ubiquitin = {
  queries: {
    ubiquitin: {
      chains: [
        {
          molecule_type: 'protein',
          chain_ids: ['A'],
          sequence: 'MQIFVKTLTGKTITLEVEPSDTIENVKAKIQDKEGIPPDQQRLIFAGKQLEDGRTLSDYNIQKESTLHLVLRLRGG',
        },
      ],
    },
  },
} satisfies Of3Input

const homomer = {
  queries: {
    leucine_zipper: {
      chains: [
        {
          molecule_type: 'protein',
          chain_ids: ['A', 'B'],
          sequence: 'XRMKQLEDKVEELLSKNYHLENEVARLKKLVGER',
        },
      ],
    },
  },
} satisfies Of3Input

const multimer = {
  queries: {
    '7cnx': {
      chains: [
        {
          molecule_type: 'protein',
          chain_ids: ['A', 'C'],
          sequence:
            'MLNSFKLSLQYILPKLWLTRLAGWGASKRAGWLTKLVIDLFVKYYKVDMKEAQKPDTASYRTFNEFFVRPLRDEVRPIDTDPNVLVMPADGVISQLGKIEEDKILQAKGHNYSLEALLAGNYLMADLFRNGTFVTTYLSPRDYHRVHMPCNGILREMIYVPGDLFSVNHLTAQNVPNLFARNERVICLFDTEFGPMAQILVGATIVGSIETVWAGTITPPREGIIKRWTWPAGENDGSVALLKGQEMGRFKLG',
        },
        {
          molecule_type: 'protein',
          chain_ids: ['B', 'D'],
          sequence: 'XTVINLFAPGKVNLVEQLESLSVTKIGQPLAVSTGHHHHHHG',
        },
      ],
    },
  },
} satisfies Of3Input

const proteinLigand = {
  queries: {
    mcl1: {
      chains: [
        {
          molecule_type: 'protein',
          chain_ids: ['A', 'B', 'C', 'D'],
          sequence:
            'GDDELYRQSLEIISRYLREQATGAKDTKPMGRSGATSRKALETLRRVGDGVQRNHETAFQGMLRKLDIKNEDDVKSLSRVMIHVFSDGVTNWGRIVTLISFGAFVAKHLKTINQESCIEPLAESITDVLVRTKRDWLVKQRGWDGFVEFFHVEDLEGG',
        },
        {
          molecule_type: 'ligand',
          chain_ids: ['F', 'G', 'H'],
          ccd_codes: 'ATP',
        },
        {
          molecule_type: 'ligand',
          chain_ids: 'Z',
          smiles: 'CC(=O)OC1C[NH+]2CCC1CC2',
        },
      ],
    },
  },
} satisfies Of3Input

const singleProteinSingleLigand = {
  queries: {
    pdb_7L39: {
      chains: [
        {
          molecule_type: 'protein',
          chain_ids: ['A'],
          sequence:
            'MNIFEMLRIDEGLRLKIYKDTEGYYTIGIGHLLTKSPSLNAAKSELDKAIGRNCNGVITKDEAEKLFNQDVDAAVRGILRNAKLKPVYDSLDAVRRCAAINMVFQMGETGVAGFTNSLRMLQQKRWDEAAVNLAKSRWYNQTPNRAKRVITTFRTGTWDAYKNL',
        },
        {
          molecule_type: 'ligand',
          chain_ids: 'X',
          smiles: 'Cc1ccccc1',
        },
      ],
    },
  },
} satisfies Of3Input

const proteinLigandPocketConstraint = {
  queries: {
    bla_1PZP_FTA: {
      chains: [
        {
          molecule_type: 'protein',
          chain_ids: 'A',
          sequence:
            'HPETLVKVKDAEDQLGARVGYIELDLNSGKILESFRPEERFPMMSTFKVLLCGAVLSRVDAGQEQLGRRIHYSQRDLVEYSPVTEKHLTDGMTVRELCSAAITMSDNTAANLLLTTIGGPKELTAFLHNMGDHVTRLDRWEPELNEAIPNDERDTTMPAAMATTLRKLLTGELLTLASRQQLIDWMEADKVAGPLLRSALPAGWFIADKSGAGERGSRGIIAALGPDGKPSRIVVIYTTGSQATMDERNRQIAEIGASLIKHW',
        },
        {
          molecule_type: 'ligand',
          chain_ids: 'L',
          smiles: 'N(c1ccccc1)c1ccc(cc1)/N=C/[C@H](C#N)c1nnn[nH]1',
        },
      ],
      pocket_constraint: {
        ligand_chain_id: 'L',
        pocket_residues: [
          ['A', 2],
          ['A', 5],
          ['A', 9],
          ['A', 12],
          ['A', 33],
          ['A', 34],
          ['A', 35],
          ['A', 36],
        ],
      },
    },
  },
} satisfies Of3Input

const proteinLigandMultiple = {
  queries: {
    mcl1_lig1: {
      chains: [
        {
          molecule_type: 'protein',
          chain_ids: ['A', 'B', 'C', 'D'],
          sequence:
            'GDDELYRQSLEIISRYLREQATGAKDTKPMGRSGATSRKALETLRRVGDGVQRNHETAFQGMLRKLDIKNEDDVKSLSRVMIHVFSDGVTNWGRIVTLISFGAFVAKHLKTINQESCIEPLAESITDVLVRTKRDWLVKQRGWDGFVEFFHVEDLEGG',
        },
        {
          molecule_type: 'ligand',
          chain_ids: ['F', 'G', 'H'],
          ccd_codes: 'ATP',
        },
        {
          molecule_type: 'ligand',
          chain_ids: 'Z',
          smiles: 'CC(=O)OC1C[NH+]2CCC1CC2',
        },
      ],
    },
    mcl1_lig2: {
      chains: [
        {
          molecule_type: 'protein',
          chain_ids: ['A', 'B', 'C', 'D'],
          sequence:
            'GDDELYRQSLEIISRYLREQATGAKDTKPMGRSGATSRKALETLRRVGDGVQRNHETAFQGMLRKLDIKNEDDVKSLSRVMIHVFSDGVTNWGRIVTLISFGAFVAKHLKTINQESCIEPLAESITDVLVRTKRDWLVKQRGWDGFVEFFHVEDLEGG',
        },
        {
          molecule_type: 'ligand',
          chain_ids: ['F', 'G', 'H'],
          ccd_codes: 'ATP',
        },
        {
          molecule_type: 'ligand',
          chain_ids: 'Z',
          smiles: 'O=C([O-])c1cc2ccccc2s1',
        },
      ],
    },
  },
} satisfies Of3Input

export const OF3_EXAMPLES: Of3Example[] = [
  { id: 'ubiquitin', input: ubiquitin },
  { id: 'homomer', input: homomer },
  { id: 'multimer', input: multimer },
  { id: 'protein-ligand', input: proteinLigand },
  { id: 'single-protein-single-ligand', input: singleProteinSingleLigand },
  { id: 'protein-ligand-pocket-constraint', input: proteinLigandPocketConstraint },
  { id: 'protein-ligand-multiple', input: proteinLigandMultiple },
]
