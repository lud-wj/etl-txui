import type { JSONSchema7, JSONSchema7Definition } from "json-schema";

import configSchema from "./config.schema.json";

type Option = {
  label: string;
  value: any;
  disabled?: boolean;
};

type ParamSet = {
  [k: string]: ConfigParamSpec[];
};

export type FormSpec = {
  sourceOptions: Option[];
  targetOptions: Option[];
  source: ParamSet;
  target: ParamSet;
};

type ConfigEntitySpec = {
  use: string;
  name: string;
  description: string;
  params: ConfigParamSpec[];
};

export type TransformStep = {
  use: string;
  params: Record<string, unknown>;
};

export type ConfigParamSpec = {
  key: string;
  description: string;
  label: string;
  required: boolean;
  type: string;
};

function asSchema(
  schema: JSONSchema7Definition | null | undefined
): JSONSchema7 {
  // In json schema 7, definitions can be booleans. But the backend should not
  // use that.
  if (schema === true) return {};

  // handle false, null, undefined
  if (!schema) return {};

  return schema;
}

function schemaToConfigEntity(schema: JSONSchema7): ConfigEntitySpec {
  const alias = fetchEntityAlias(schema);
  const name =
    ((schema as Record<string, string>)["x-etl-name"] as string | undefined) ||
    alias;
  // description is markdown, we only want the first paragraph.
  const description = schema.description.split("\n\n")[0] || "";
  const paramsSchema = asSchema(schema.properties?.params);
  const params = Object.entries(paramsSchema.properties || {}).map(
    ([key, paramSchema]: [string, JSONSchema7]) =>
      schemaToParamSpec(paramSchema, key, paramsSchema.required)
  );
  return { use: alias, name, description, params };
}

function fetchEntityAlias(schema: JSONSchema7): string {
  const usePropSEnum = asSchema(schema.properties?.use).enum;
  if (!usePropSEnum) {
    throw new Error("invalid entity schema (no use enum)");
  }
  if (!Array.isArray(usePropSEnum)) {
    throw new Error("invalid entity schema (not an array)");
  }
  if (usePropSEnum.length !== 1) {
    throw new Error(
      "invalid entity schema (use enum must have a single value)"
    );
  }
  return usePropSEnum[0].toString();
}

function schemaToParamSpec(
  schema: JSONSchema7,
  key: string,
  requiredFields: string[]
): ConfigParamSpec {
  const description = schema.description || "";
  const label = (schema as Record<string, string>)["x-etl-label"] || key;
  const types = [schema.type || "string"].flat();
  const type = types.filter((t) => t !== "null").at(0);

  return {
    key,
    description,
    label: capitalizeFirstLetter(label.replaceAll("_", " ")),
    type: type === "integer" ? "number" : type,
    required: requiredFields.includes(key),
  };
}

function fetchEntityRef(schema: JSONSchema7, ref: string): JSONSchema7 {
  // the ref starts with "#/definitions/"
  const defName = ref.match(/^#\/definitions\/(.*)/)[1];
  const found = schema.definitions[defName];
  if (!(typeof found === "object")) {
    throw new Error("config entity schema is not an object");
  }
  return found;
}

function fetchConcreteRefs(schema: JSONSchema7, ref: string): string[] {
  const abstract: JSONSchema7Definition = asSchema(schema.definitions?.[ref]);

  return (abstract.oneOf || [])
    .map(asSchema)
    .flatMap((item) => (item.$ref ? [item.$ref] : []));
}

const capitalizeFirstLetter = (s: string) =>
  s.charAt(0).toUpperCase() + s.slice(1);

const toFormSpec = (c: ConfigEntitySpec[]): [Option[], ParamSet] => {
  const options: Option[] = [];
  const set: ParamSet = {};

  c.forEach((e) => {
    options.push({ value: e.use, label: e.name });
    set[e.use] = e.params;
  });

  return [options, set];
};

function schemaResponseToFormSpec() {
  const sources = fetchConcreteRefs(configSchema, "source")
    .map((ref) => fetchEntityRef(configSchema, ref))
    .map(schemaToConfigEntity);
  const targets = fetchConcreteRefs(configSchema, "target")
    .map((ref) => fetchEntityRef(configSchema, ref))
    .map(schemaToConfigEntity);
  const [sourceOptions, source] = toFormSpec(sources);
  const [targetOptions, target] = toFormSpec(targets);

  return {
    sourceOptions,
    targetOptions,
    source,
    target,
  };
}

export const formSpec = schemaResponseToFormSpec();
