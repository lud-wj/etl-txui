<script>
  const { index, step } = $props();

  let keyToRead = $state("");
  let keyToWrite = $state("");

  let concatParts = $state([]);

  const inputClist =
    "shadow appearance-none border border-gray-500 rounded w-full px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline";

  $effect(() => {
    step.use = "step.transform";
    step.params = {
      run: [
        { use: "read_key", params: { key: keyToRead } },
        ...concatParts.map((v) => ({
          use: "string.concat",
          params: {
            suffix: { __run__: [{ use: "read_key", params: { key: v } }] },
          },
        })),
        { use: "write_key", params: { key: keyToWrite } },
      ],
    };
  });
</script>

<div class="border-blue-500 border p-2">
  <h3 class="text-lg">Concat to key {keyToWrite || `""`}</h3>

  <div class="flex align-center spa">
    <div>
      <span class="p-1">Read Key</span><input
        class={inputClist}
        type="text"
        value={keyToRead}
        oninput={(e) => (keyToRead = e.target.value)}
      />
    </div>
    <div>
      <span class="p-1">Write Key</span><input
        class={inputClist}
        type="text"
        value={keyToWrite}
        oninput={(e) => (keyToWrite = e.target.value)}
      />
    </div>
  </div>

  <div>
    {#each concatParts as part, index}
      <div>
        <input
          class={inputClist}
          value={part}
          oninput={(e) => (concatParts[index] = e.target.value)}
        />
      </div>
    {/each}

    <button class="bg-gray-500 hover:bg-blue-700 text-white font-bold px-4 rounded"
      onclick={() => {
        concatParts.push("");
      }}
    >
      Add Key
    </button>
  </div>

  <!-- <div><span class="p"-1">Mapping</span><input class={inputClist} type=text value={mappingRef} oninput={e => mappingRef = e.target.value} /></div> -->
  <!-- <div><span class="p-1">Column</span><input class={inputClist} type=text value={mappingColumn} oninput={e => mappingColumn = e.target.value} /></div> -->
</div>
