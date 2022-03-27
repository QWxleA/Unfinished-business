import '@logseq/libs';
import { BlockEntity, SettingSchemaDesc } from '@logseq/libs/dist/LSPlugin';
// import { SettingSchemaDesc } from '@logseq/libs/dist/LSPlugin';

const markers = ['"TODO" "LATER" "DOING" "NOW"','"LATER" "NOW"','"TODO" "DOING"']
export const settingsTemplate: SettingSchemaDesc[] = [{
  key: "defaultTag",
  type: 'string',
  default: "testme",
  title: "default search tag?",
  description: "Use this for testing, or if you tag your tasks",
},
{
   key: "searchMarkers",
   type: 'enum',
   enumChoices: markers,
   enumPicker: 'radio',
   default: markers[1],
   title: "What markers to carry over to today?",
   description: "What markers should be moved, and which should stay?",
}
]
logseq.useSettingsSchema(settingsTemplate);

// async function getLastBlock(pageName: string): Promise<null | BlockEntity> {
//   const blocks = await logseq.Editor.getPageBlocksTree(pageName);
//   if (blocks.length === 0) {
//     return null;
//   }
//   return blocks[blocks.length - 1];
// }

// //Inputs 5 numbered blocks when called
// async function insertSomeBlocks (e) {
//   console.log('Open the calendar!')
//   let numberArray = [1, 2, 3, 4, 5]
//   for (const number in numberArray){
//   logseq.App.showMsg("Function has been run")
//   logseq.Editor.insertBlock(e.uuid, `This is block ${numberArray[number]}`, {sibling: true})}

//   }
  
function journalYesterday() {
  //hardcoded yesterday
  let date = (function(d){ d.setDate(d.getDate()-1); return d})(new Date)
  return parseInt(`${date.getFullYear()}${("0" + (date.getMonth()+1)).slice(-2)}${("0" + date.getDate()).slice(-2)}`,10)
}

async function parseQuery(queryTag){
  const searchTag = (queryTag) ? `[?b :block/path-refs [:block/name "${queryTag.toLowerCase().trim().replace(/^["'](.+(?=["']$))["']$/, '$1')}"]]
` : ""
  // https://stackoverflow.com/questions/19156148/i-want-to-remove-double-quotes-from-a-string
  const query = `[:find (pull ?b [*])
    :where
    [?b :block/marker ?m]
    [(contains? #{${markers[logseq.settings.searchMarkers]} ?m)]
    ${searchTag}
    [?b :block/page ?p]
    [?p :block/journal? true]
    [?p :block/journal-day ${journalYesterday()}]]`
  try { 
    console.log("UB query",query, markers, logseq.settings.searchMarkers)
    const results = await logseq.DB.datascriptQuery(query) 
    // console.log("UB results",results)
    // let flattenedResults = results.map((mappedQuery) => ({
    //   uuid: mappedQuery[0].uuid['$uuid$'],
    // return(flattenedResults)
    return(results)
  } catch (error) {return false}
}

async function onTemplate(uuid){
  //is block(uuid) on a template?
  try {
    const block = await logseq.Editor.getBlock(uuid, {includeChildren: false})
    const checkTPL = (block.properties && block.properties.template != undefined) ? true : false
    const checkPRT = (block.parent != null && block.parent.id !== block.page.id)  ? true : false

    if (checkTPL === false && checkPRT === false) return false
    if (checkTPL === true )                       return true 
    return await onTemplate(block.parent.id) 

  } catch (error) { console.log(error) }
}

const main = async () => {
  //  FIXME do I want to give feedback? logseq.App.showMsg('❤️ Message from Hello World Plugin :)')
  logseq.provideModel({
  })
  console.log("we're in business")

  logseq.Editor.registerSlashCommand("Move unfinished business here", async () => {
    await logseq.Editor.insertAtEditingCursor(`{{renderer :unfinishedBusiness ${logseq.settings.defaultTag ? ", "+logseq.settings.defaultTag : ""}}}`)})

  logseq.App.onMacroRendererSlotted(async ({ slot, payload }) => {
    try {
      console.log("OK", payload)
      console.log("OK.arg", payload.arguments)
      console.log("OK.arg[0]", payload.arguments[0])
      if (payload.arguments[0].trim() !== ":unfinishedBusiness") return
      console.log("OK22", payload)

      const taskTag = (payload.arguments.length > 1) ? payload.arguments[1] : "" 
      console.log("TT", taskTag, "-", payload.arguments[1], "l:", payload.arguments.length)

      //is the block on a template?
      const templYN = await onTemplate(payload.uuid)        
      // parseQuery returns false if no block can be found
      const blocks = await parseQuery(taskTag)
      console.log(`template? ${templYN} blocks:`,blocks,blocks.length)

      const color  = ( templYN === true ) ? "green" : "red"
      const errMsg = ( templYN === true ) ? "will run with template" : "Cannot find tagged tasks"

      if ( templYN ||  blocks == false ) { 
          await logseq.provideUI({
          key: "unfinished-business",
          slot,
          template: `<span style="color: ${color}">{{renderer ${payload.arguments} }}</span> (${errMsg})`,
          reset: true,
          style: { flex: 1 },
        })
        return 
      }
      else { 
        await logseq.Editor.updateBlock(payload.uuid, `**🚀 Moved ${blocks ?  blocks.length : "zero" } unfinished tasks from yesterday ${ (taskTag) ? "(#"+taskTag+")" : "" }**` ) 
        blocks.forEach(async (item) => {
          await logseq.Editor.moveBlock(item[0].uuid['$uuid$'], payload.uuid, { before: true })
          // console.log("item:",item[0].uuid['$uuid$'])
        })
      }  
    } catch (error) { console.log(error) }
  })
}
logseq.ready(main).catch(console.error);
