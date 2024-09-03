<script>
  import { formSpec } from "$lib/form-spec";
  import config from "$lib/config-store.svelte";

  import SetMapping from "$lib/ui-components/set-mapping.svelte";
  import SetConcat from "$lib/ui-components/set-concat.svelte";

  const componentRegistry = [
    { key: "setWithMapping", label: "Set with mapping", comp: SetMapping },
    { key: "setConcatStrings", label: "Set concatenated", comp: SetConcat },
  ];

  function componentByKey(key) {
    let entry = componentRegistry.find((v) => v.key == key);
    if (entry) return entry.comp;
    else throw new Error(`no component "${key}"`);
  }

  const stepAddOptions = componentRegistry.map(({ key, label }) => ({
    label,
    value: key,
  }));

  let toAdd = $state();

  function addStep() {
    if (toAdd) {
      config.updateTransform(function (ts) {
        ts.push({ frontend: toAdd });
        return ts;
      });
    }
  }

  const stepComponentList = $derived(function () {
    return config.transform.map(function (step) {
      return { step, comp: componentByKey(ts.frontend) };
    });
  });
</script>

<h1 class="text-xl py-4">Transforms</h1>

{#each config.transform as ts, index}
  {@const CC = componentByKey(ts.frontend)}
  <CC step={ts} {index} />
{/each}

<select
  onchange={(e) => {
    toAdd = e.target.value;
  }}
>
  <option></option>
  {#each stepAddOptions as addopt}
    <option value={addopt.value}>{addopt.label}</option>
  {/each}
</select>
<button
  class="bg-blue-500 hover:bg-blue-700 text-white font-bold px-4 rounded"
  onclick={addStep}>Add {toAdd}</button
>

<pre class="text-xs">{JSON.stringify(config.transform, void 0, "  ")}</pre>
