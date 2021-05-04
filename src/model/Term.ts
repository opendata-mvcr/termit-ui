import {ASSET_CONTEXT, AssetData, default as Asset} from "./Asset";
import Utils from "../util/Utils";
import WithUnmappedProperties from "./WithUnmappedProperties";
import VocabularyUtils from "../util/VocabularyUtils";
import * as _ from "lodash";
import {
    BASE_CONTEXT as BASE_OCCURRENCE_CONTEXT,
    TermOccurrenceData,
} from "./TermOccurrence";
import MultilingualString, {
    context,
    getLocalized,
    PluralMultilingualString,
} from "./MultilingualString";

const ctx = {
    label: context(VocabularyUtils.SKOS_PREF_LABEL),
    altLabels: context(VocabularyUtils.SKOS_ALT_LABEL),
    hiddenLabels: context(VocabularyUtils.SKOS_HIDDEN_LABEL),
    definition: context(VocabularyUtils.DEFINITION),
    scopeNote: context(VocabularyUtils.SKOS_SCOPE_NOTE),
    parentTerms: VocabularyUtils.BROADER,
    superTypes: VocabularyUtils.RDFS_SUB_CLASS_OF,
    subTerms: VocabularyUtils.NARROWER,
    sources: VocabularyUtils.DC_SOURCE,
    vocabulary: VocabularyUtils.IS_TERM_FROM_VOCABULARY,
    definitionSource: VocabularyUtils.HAS_DEFINITION_SOURCE,
    draft: VocabularyUtils.IS_DRAFT,
    published: VocabularyUtils.IS_PUBLISHED,
    glossary: VocabularyUtils.SKOS_IN_SCHEME,
    types: "@type",
};

export const CONTEXT = Object.assign(
    ctx,
    ASSET_CONTEXT,
    BASE_OCCURRENCE_CONTEXT
);

const MAPPED_PROPERTIES = [
    "@context",
    "iri",
    "label",
    "altLabels",
    "hiddenLabels",
    "scopeNote",
    "definition",
    "subTerms",
    "sources",
    "types",
    "parentTerms",
    "superTypes",
    "parent",
    "plainSubTerms",
    "vocabulary",
    "glossary",
    "definitionSource",
    "draft",
    "published",
];

export const TERM_MULTILINGUAL_ATTRIBUTES = [
    "label",
    "definition",
    "altLabels",
    "hiddenLabels",
];

export interface TermData extends AssetData {
    label: MultilingualString;
    altLabels?: PluralMultilingualString;
    hiddenLabels?: PluralMultilingualString;
    scopeNote?: MultilingualString;
    definition?: MultilingualString;
    subTerms?: TermInfo[];
    sources?: string[];
    // Represents proper parent Term, stripped of broader terms representing other model relationships
    parentTerms?: TermData[];
    superTypes?: TermData[];
    parent?: string; // Introduced in order to support the Intelligent Tree Select component
    plainSubTerms?: string[]; // Introduced in order to support the Intelligent Tree Select component
    vocabulary?: AssetData;
    definitionSource?: TermOccurrenceData;
    draft?: boolean;
}

export interface TermInfo {
    iri: string;
    label: MultilingualString; // Multilingual string due to the same context item (see ctx above)
    vocabulary: AssetData;
}

export function termInfoComparator(a: TermInfo, b: TermInfo) {
    return getLocalized(a.label).localeCompare(getLocalized(b.label));
}

declare type TermMap = { [key: string]: Term };

export default class Term extends Asset implements TermData {
    public label: MultilingualString;
    public altLabels?: PluralMultilingualString;
    public hiddenLabels?: PluralMultilingualString;
    public scopeNote?: MultilingualString;
    public definition?: MultilingualString;
    public subTerms?: TermInfo[];
    public parentTerms?: Term[];
    public superTypes?: Term[];
    public readonly parent?: string;
    public sources?: string[];
    public plainSubTerms?: string[];
    public readonly vocabulary?: AssetData;
    public readonly definitionSource?: TermOccurrenceData;
    public draft: boolean;

    constructor(termData: TermData, visitedTerms: TermMap = {}) {
        super(termData);
        Object.assign(this, termData);
        this.label = termData.label;
        this.types = Utils.sanitizeArray(termData.types);
        if (this.types.indexOf(VocabularyUtils.TERM) === -1) {
            this.types.push(VocabularyUtils.TERM);
        }
        if (this.parentTerms) {
            this.parentTerms = this.sanitizeTermReferences(this.parentTerms, visitedTerms);
            this.parent = this.resolveParent(this.parentTerms);
        }
        if (this.superTypes) {
            this.superTypes = this.sanitizeTermReferences(this.superTypes, visitedTerms);
            this.superTypes.sort(Utils.labelComparator);
        }
        if (this.subTerms) {
            // jsonld replaces single-element arrays with singular elements, which we don't want here
            this.subTerms = Utils.sanitizeArray(this.subTerms);
        }
        this.syncPlainSubTerms();
        this.draft = termData.draft !== undefined ? termData.draft : true;
    }

    private sanitizeTermReferences(references: Term[], visitedTerms: TermMap) {
        visitedTerms[this.iri] = this;
        const result = Utils.sanitizeArray(references).map((pt) =>
            visitedTerms[pt.iri]
                ? visitedTerms[pt.iri]
                : new Term(pt, visitedTerms)
        );
        result.sort(Utils.labelComparator);
        return result;
    }

    private resolveParent(parents: Term[]) {
        const sameVocabulary = parents.find((t) =>
            _.isEqual(t.vocabulary, this.vocabulary)
        );
        if (sameVocabulary) {
            return sameVocabulary.iri;
        }
        return undefined;
    }

    /**
     * Synchronizes the value of plainSubTerms with subTerms.
     */
    public syncPlainSubTerms() {
        if (this.subTerms) {
            this.plainSubTerms = Utils.sanitizeArray(this.subTerms).map(
                (st) => st.iri
            );
        } else {
            this.plainSubTerms = undefined;
        }
    }

    public toTermData(withoutParents: boolean = false): TermData {
        const result: any = Object.assign({}, this);
        if (result.parentTerms) {
            if (withoutParents) {
                result.parentTerms = undefined;
            } else {
                result.parentTerms = result.parentTerms.map((pt: Term) =>
                    pt.toTermData(true)
                );
            }
        }
        if (result.superTypes) {
            if (withoutParents) {
                result.superTypes = undefined;
            } else {
                result.superTypes = result.superTypes.map((pt: Term) => pt.toTermData(true));
            }
        }
        if (result.definitionSource) {
            result.definitionSource.term = {iri: result.iri};
        }
        delete result.subTerms; // Sub-terms are inferred and inconsequential for data upload to server
        delete result.plainSubTerms;
        delete result.parent;
        return result;
    }

    public get unmappedProperties(): Map<string, string[]> {
        return WithUnmappedProperties.getUnmappedProperties(
            this,
            MAPPED_PROPERTIES
        );
    }

    public set unmappedProperties(properties: Map<string, string[]>) {
        WithUnmappedProperties.setUnmappedProperties(
            this,
            properties,
            MAPPED_PROPERTIES
        );
    }

    getLabel(lang?: string): string {
        return getLocalized(this.label, lang);
    }

    public toJsonLd(): TermData {
        const termData = this.toTermData();
        Object.assign(termData, {"@context": CONTEXT});
        return termData;
    }

    /**
     * Removes translation in the specified language from the specified term data.
     *
     * The removal happens in place.
     * @param data Data to remove translation from.
     * @param lang Language to remove
     */
    public static removeTranslation(data: TermData, lang: string) {
        TERM_MULTILINGUAL_ATTRIBUTES.forEach((att) => {
            if (data[att]) {
                delete data[att][lang];
            }
        });
    }

    public static isDraft(data: TermData): boolean {
        return data.draft === undefined || data.draft;
    }

    public static getLanguages(term: Term | TermData): string[] {
        const languages: Set<string> = new Set();
        TERM_MULTILINGUAL_ATTRIBUTES.filter((att) => term[att]).forEach(
            (att) => {
                Utils.sanitizeArray(term[att]).forEach((attValue) =>
                    Object.getOwnPropertyNames(attValue).forEach((n) =>
                        languages.add(n)
                    )
                );
            }
        );
        const langArr = Array.from(languages);
        langArr.sort();
        return langArr;
    }
}
