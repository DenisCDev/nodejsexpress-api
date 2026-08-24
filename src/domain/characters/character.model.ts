import { Schema, model, type InferSchemaType, type HydratedDocument } from 'mongoose';

export const CHARACTER_CLASSES = [
  'barbaro', 'bardo', 'bruxo', 'clerigo', 'druida', 'feiticeiro',
  'guerreiro', 'ladino', 'mago', 'monge', 'paladino', 'patrulheiro',
] as const;

export const CHARACTER_RACES = [
  'humano', 'elfo', 'anao', 'halfling', 'meio-elfo', 'meio-orc',
  'draconato', 'gnomo', 'tiefling',
] as const;

export const ALIGNMENTS = [
  'leal-bom', 'neutro-bom', 'caotico-bom',
  'leal-neutro', 'neutro', 'caotico-neutro',
  'leal-mau', 'neutro-mau', 'caotico-mau',
] as const;

const characterSchema = new Schema(
  {
    nome: { type: String, required: true, trim: true, maxlength: 100 },
    idade: { type: Number, required: true, min: 0, max: 10_000 },
    classe: { type: String, required: true, enum: CHARACTER_CLASSES },
    nivel: { type: Number, required: true, min: 1, max: 20, default: 1 },
    raca: { type: String, required: true, enum: CHARACTER_RACES },
    antecedente: { type: String, required: true, trim: true, maxlength: 100 },
    alinhamento: { type: String, required: true, enum: ALIGNMENTS },
    imagemPersonagem: { type: String, trim: true, maxlength: 2048 },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

characterSchema.index({ ownerId: 1, createdAt: -1 });
characterSchema.index({ ownerId: 1, classe: 1 });
characterSchema.index({ ownerId: 1, raca: 1 });

characterSchema.set('toJSON', {
  transform: (_doc, ret: Record<string, unknown>) => {
    ret.id = String(ret._id);
    ret.ownerId = String(ret.ownerId);
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export type Character = InferSchemaType<typeof characterSchema>;
export type CharacterDocument = HydratedDocument<Character>;
export const CharacterModel = model('Character', characterSchema);
