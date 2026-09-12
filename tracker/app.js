const KEY='moneycommons.debtfree.v5';
const defaultCategories=['Food','Groceries','Transport','Shopping','Subscriptions','Entertainment','Bills','Health','Home','Personal','Other'];
const defaults={income:0,essential:0,flexible:0,expenses:[],monthExpenses:[],debts:[],checkins:[],categories:defaultCategories};
let state=JSON.parse(localStorage.getItem(KEY)||'null')||structuredClone(defaults);
state.categories=[...new Set([...(state.categories||[]),...defaultCategories])];
state.monthExpenses=Array.isArray(state.monthExpenses)?state.monthExpenses:[];
const $=id=>document.getElementById(id);
const gbp=n=>new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP'}).format(Number(n)||0);
const num=v=>Math.max(0,Number(v)||0);
function save(){localStorage.setItem(KEY,JSON.stringify(state));}
function auditTotal(){return state.expenses.reduce((s,x)=>s+num(x.amount),0)}
function monthExtraTotal(){return state.monthExpenses.reduce((s,x)=>s+num(x.amount),0)}
function plannedSpending(){return num(state.essential)+num(state.flexible)}
function totalSpending(){return plannedSpending()+monthExtraTotal()}
function moneyLeft(){return num(state.income)-totalSpending()}
function refreshSummary(){
 const income=num(state.income), spending=totalSpending(), left=income-spending;
 const debt=state.debts.reduce((s,x)=>s+num(x.balance),0), mins=state.debts.reduce((s,x)=>s+num(x.min),0);
 $('left').textContent=gbp(left);$('incomeOut').textContent=gbp(income);$('spendOut').textContent=gbp(spending);$('debtOut').textContent=gbp(debt);
 $('debtCount').textContent=`${state.debts.length} balance${state.debts.length===1?'':'s'}`;
 $('leftMsg').textContent=left<0?'Spending is above income — look for reductions first.':'This is what remains before extra debt payments.';
 const pct=income?Math.min(100,Math.max(0,spending/income*100)):0;
 $('barFill').style.width=pct+'%';$('usedPct').textContent=Math.round(pct)+'%';
 $('spendBreakdown').textContent=`planned £${Math.round(plannedSpending())} + extra ${gbp(monthExtraTotal())}`;
 $('extraAvail').textContent=gbp(Math.max(0,left));$('minimums').textContent=gbp(mins);$('extraPayment').textContent=gbp(Math.max(0,left-mins));
 $('auditTotal').textContent=gbp(auditTotal());$('monthExtraTotal').textContent=gbp(monthExtraTotal());$('monthMoneyLeft').textContent=gbp(left);
}
function render(){
 $('income').value=state.income||'';$('essential').value=state.essential||'';$('flexible').value=state.flexible||'';
 refreshSummary();renderExpenses();renderMonthExpenses();renderDebts();renderCheckins();sim();inflationCalc();
}
['income','essential','flexible'].forEach(id=>$(id).addEventListener('input',e=>{state[id]=num(e.target.value);save();refreshSummary()}));
function categoryOptions(selected='Other'){
 return [...new Set([...state.categories,selected])].map(c=>`<option value="${esc(c)}" ${c===selected?'selected':''}>${esc(c)}</option>`).join('');
}
function renderExpenses(){
 const box=$('expenses');box.innerHTML='';$('emptyExpenses').style.display=state.expenses.length?'none':'block';
 state.expenses.forEach((x,i)=>{
  const d=document.createElement('div');d.className='expense';
  d.innerHTML=`<input class="wide" data-i="${i}" data-k="name" value="${esc(x.name)}" placeholder="Expense"><select data-i="${i}" data-k="category">${categoryOptions(x.category||'Other')}</select><input data-i="${i}" data-k="amount" type="number" min="0" step="0.01" value="${num(x.amount)}"><select data-i="${i}" data-k="essential"><option value="Flexible" ${!x.essential?'selected':''}>Flexible</option><option value="Essential" ${x.essential?'selected':''}>Essential</option></select><button type="button" class="danger" data-remove-expense="${i}">Remove</button>`;
  box.appendChild(d);
 });
 bindExpenseRows(box);
 box.querySelectorAll('[data-remove-expense]').forEach(btn=>btn.addEventListener('click',e=>{e.preventDefault();state.expenses.splice(+btn.dataset.removeExpense,1);save();renderExpenses();refreshSummary()}));
}
function bindExpenseRows(box){
 box.querySelectorAll('[data-k]').forEach(el=>el.addEventListener('input',()=>updateExpenseField(el)));
 box.querySelectorAll('select[data-k]').forEach(el=>el.addEventListener('change',()=>updateExpenseField(el)));
}
function updateExpenseField(el){const i=+el.dataset.i,k=el.dataset.k,x=state.expenses[i];if(!x)return;if(k==='amount')x.amount=num(el.value);else if(k==='essential')x.essential=el.value==='Essential';else x[k]=el.value;save();refreshSummary()}
function closeExpenseForm(){const form=$('expenseForm');form.hidden=true;form.innerHTML=''}
function addExpenseFormRow(index){
 const wrap=document.createElement('div');wrap.className='batch-row';wrap.innerHTML=`<label>What did you spend on?<input data-batch-name="${index}" type="text" placeholder="e.g. Takeaway"></label><label>Category<select data-batch-category="${index}">${categoryOptions('Food')}<option value="__custom__">＋ Add your own category</option></select><input class="custom-category" data-batch-custom="${index}" type="text" placeholder="Type your category" hidden></label><label>Amount (£)<input data-batch-amount="${index}" type="number" min="0" step="0.01" placeholder="0.00"></label><label>Type<select data-batch-essential="${index}"><option value="flexible">Flexible</option><option value="essential">Essential</option></select></label><button type="button" class="danger batch-remove" data-batch-remove="${index}">Remove</button>`;
 const cat=wrap.querySelector(`[data-batch-category="${index}"]`), custom=wrap.querySelector(`[data-batch-custom="${index}"]`);
 cat.addEventListener('change',()=>{custom.hidden=cat.value!=='__custom__';if(!custom.hidden)custom.focus()});
 wrap.querySelector('.batch-remove').addEventListener('click',()=>{wrap.remove();renumberBatchRows($('expenseBatch'))});
 return wrap;
}
function renumberBatchRows(container){[...container.children].forEach((row,i)=>row.querySelectorAll('[data-batch-name],[data-batch-category],[data-batch-custom],[data-batch-amount],[data-batch-essential],[data-batch-remove]').forEach(el=>{const attr=[...el.attributes].find(a=>a.name.startsWith('data-batch-'));if(attr)el.setAttribute(attr.name,attr.value.replace(/\d+$/,i))}))}
function openExpenseForm(){
 const form=$('expenseForm');form.hidden=false;form.innerHTML=`<div class="form-heading"><div><b>Add expenses together</b><span>Enter as many as you need, then save them all at once.</span></div><button type="button" class="btn secondary" id="addBatchExpense">+ Add another</button></div><div id="expenseBatch"></div><div class="inline-form-actions"><button type="button" class="btn secondary" id="cancelExpense">Cancel</button><button type="button" class="btn" id="saveExpenseBatch">Save expenses</button></div>`;
 const batch=$('expenseBatch');batch.appendChild(addExpenseFormRow(0));
 $('addBatchExpense').onclick=()=>batch.appendChild(addExpenseFormRow(batch.children.length));$('cancelExpense').onclick=closeExpenseForm;
 $('saveExpenseBatch').onclick=()=>{let added=0;[...batch.children].forEach(row=>{const name=row.querySelector('[data-batch-name]').value.trim()||'Unnamed expense';const amount=num(row.querySelector('[data-batch-amount]').value);const essential=row.querySelector('[data-batch-essential]').value==='essential';const catEl=row.querySelector('[data-batch-category]');const custom=row.querySelector('[data-batch-custom]');let category=catEl.value==='__custom__'?custom.value.trim():catEl.value;if(!category)category='Other';if(!state.categories.includes(category))state.categories.push(category);state.expenses.push({name,category,amount,essential});added++});if(added){save();closeExpenseForm();renderExpenses();refreshSummary()}};
 form.scrollIntoView({behavior:'smooth',block:'nearest'});
}
$('addExpense').onclick=e=>{e.preventDefault();openExpenseForm()};
$('loadExpenseExample').onclick=()=>{state.expenses=[{name:'Takeaway dinner',category:'Food',amount:22.50,essential:false},{name:'Streaming subscription',category:'Subscriptions',amount:12.99,essential:false},{name:'Coffee on the way to work',category:'Food',amount:4.20,essential:false},{name:'Fuel',category:'Transport',amount:65,essential:true},{name:'Impulse online purchase',category:'Shopping',amount:35,essential:false}];save();renderExpenses();refreshSummary()};
function closeMonthForm(){const form=$('monthForm');form.hidden=true;form.innerHTML=''}
function monthFormRow(i){
 const wrap=document.createElement('div');wrap.className='batch-row';wrap.innerHTML=`<label>What happened?<input data-month-name="${i}" type="text" placeholder="e.g. Unexpected repair"></label><label>Category<select data-month-category="${i}">${categoryOptions('Other')}<option value="__custom__">＋ Add your own category</option></select><input class="custom-category" data-month-custom="${i}" type="text" placeholder="Type your category" hidden></label><label>Amount (£)<input data-month-amount="${i}" type="number" min="0" step="0.01" placeholder="0.00"></label><label>Essential?<select data-month-essential="${i}"><option value="no">No</option><option value="yes">Yes</option></select></label><button type="button" class="danger batch-remove">Remove</button>`;
 const cat=wrap.querySelector(`[data-month-category="${i}"]`),custom=wrap.querySelector(`[data-month-custom="${i}"]`);cat.addEventListener('change',()=>{custom.hidden=cat.value!=='__custom__';if(!custom.hidden)custom.focus()});wrap.querySelector('.batch-remove').addEventListener('click',()=>wrap.remove());return wrap;
}
function openMonthForm(){const form=$('monthForm');form.hidden=false;form.innerHTML=`<div class="form-heading"><div><b>Log extra spending</b><span>Add one or many purchases, surprises or one-off costs.</span></div><button type="button" class="btn secondary" id="addMonthRow">+ Add another</button></div><div id="monthBatch"></div><div class="inline-form-actions"><button type="button" class="btn secondary" id="cancelMonth">Cancel</button><button type="button" class="btn" id="saveMonthBatch">Save spending</button></div>`;const batch=$('monthBatch');batch.appendChild(monthFormRow(0));$('addMonthRow').onclick=()=>batch.appendChild(monthFormRow(batch.children.length));$('cancelMonth').onclick=closeMonthForm;$('saveMonthBatch').onclick=()=>{[...batch.children].forEach(row=>{const name=row.querySelector('[data-month-name]').value.trim()||'Unnamed spending';const amount=num(row.querySelector('[data-month-amount]').value);const essential=row.querySelector('[data-month-essential]').value==='yes';const catEl=row.querySelector('[data-month-category]'),custom=row.querySelector('[data-month-custom]');let category=catEl.value==='__custom__'?custom.value.trim():catEl.value;if(!category)category='Other';if(!state.categories.includes(category))state.categories.push(category);state.monthExpenses.push({name,category,amount,essential})});save();closeMonthForm();renderMonthExpenses();refreshSummary()};form.scrollIntoView({behavior:'smooth',block:'nearest'})}
$('addMonthExpense').onclick=e=>{e.preventDefault();openMonthForm()};
$('loadMonthExample').onclick=()=>{state.monthExpenses=[{name:'Unexpected car repair',category:'Transport',amount:90,essential:true},{name:'Dinner with friends',category:'Entertainment',amount:28,essential:false},{name:'Replacement household item',category:'Home',amount:16.50,essential:true}];save();renderMonthExpenses();refreshSummary()};
function renderMonthExpenses(){const box=$('monthExpenses');box.innerHTML='';$('emptyMonthExpenses').style.display=state.monthExpenses.length?'none':'block';state.monthExpenses.forEach((x,i)=>{const d=document.createElement('div');d.className='expense';d.innerHTML=`<input class="wide" data-mi="${i}" data-mk="name" value="${esc(x.name)}" placeholder="Spending"><select data-mi="${i}" data-mk="category">${categoryOptions(x.category||'Other')}</select><input data-mi="${i}" data-mk="amount" type="number" min="0" step="0.01" value="${num(x.amount)}"><select data-mi="${i}" data-mk="essential"><option value="No" ${!x.essential?'selected':''}>No</option><option value="Yes" ${x.essential?'selected':''}>Yes</option></select><button type="button" class="danger" data-remove-month="${i}">Remove</button>`;box.appendChild(d)});box.querySelectorAll('[data-mk]').forEach(el=>el.addEventListener('input',()=>updateMonthField(el)));box.querySelectorAll('select[data-mk]').forEach(el=>el.addEventListener('change',()=>updateMonthField(el)));box.querySelectorAll('[data-remove-month]').forEach(btn=>btn.addEventListener('click',()=>{state.monthExpenses.splice(+btn.dataset.removeMonth,1);save();renderMonthExpenses();refreshSummary()}))}
function updateMonthField(el){const i=+el.dataset.mi,k=el.dataset.mk,x=state.monthExpenses[i];if(!x)return;if(k==='amount')x.amount=num(el.value);else if(k==='essential')x.essential=el.value==='Yes';else x[k]=el.value;save();refreshSummary()}
$('addDebt').onclick=e=>{e.preventDefault();state.debts.push({name:'New debt',balance:0,min:0,apr:0});save();renderDebts();refreshSummary()};
$('loadDebtExample').onclick=()=>{state.debts=[{name:'Credit card',balance:1800,min:55,apr:24.9},{name:'Personal loan',balance:4200,min:180,apr:8.9},{name:'Car finance',balance:6000,min:220,apr:7.4}];save();renderDebts();refreshSummary()};
function renderDebts(){const box=$('debtList');box.innerHTML='';$('emptyDebts').style.display=state.debts.length?'none':'block';state.debts.forEach((x,i)=>{const d=document.createElement('div');d.className='debt';d.innerHTML=`<input class="wide" data-i="${i}" data-k="name" value="${esc(x.name)}" placeholder="Debt name"><input data-i="${i}" data-k="balance" type="number" min="0" step="0.01" value="${num(x.balance)}" placeholder="Balance"><input data-i="${i}" data-k="min" type="number" min="0" step="0.01" value="${num(x.min)}" placeholder="Minimum / month"><input data-i="${i}" data-k="apr" type="number" min="0" step="0.01" value="${num(x.apr)}" placeholder="APR %"><button type="button" class="danger" data-remove-debt="${i}">Remove</button>`;box.appendChild(d)});box.querySelectorAll('[data-k]').forEach(el=>el.addEventListener('input',()=>{const i=+el.dataset.i,k=el.dataset.k;if(k==='name')state.debts[i][k]=el.value;else state.debts[i][k]=num(el.value);save();refreshSummary()}));box.querySelectorAll('[data-remove-debt]').forEach(btn=>btn.addEventListener('click',()=>{state.debts.splice(+btn.dataset.removeDebt,1);save();renderDebts();refreshSummary()}))}
$('saveDaily').onclick=()=>{const spend=num($('today').value),note=$('reflection').value.trim();if(!spend&&!note){$('reflection').focus();return}state.checkins.unshift({date:new Date().toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}),spend,note});state.checkins=state.checkins.slice(0,14);$('today').value='';$('reflection').value='';save();renderCheckins()};
function renderCheckins(){const b=$('checkins');b.innerHTML='';if(!state.checkins.length){b.innerHTML='<div class="empty">Your reflections will appear here.</div>';return}state.checkins.forEach(x=>{const d=document.createElement('div');d.className='checkin';d.innerHTML=`<small>${esc(x.date)} · ${gbp(x.spend)}</small><br>${esc(x.note||'No note')}</br>`;b.appendChild(d)})}
['cut','simMonths'].forEach(id=>$(id).addEventListener('input',sim));
function sim(){const cut=num($('cut').value),m=Math.max(1,num($('simMonths').value));$('simResult').textContent=gbp(cut*m);$('simText').textContent=`${gbp(cut)} × ${m} month${m===1?'':'s'}`}
['goalToday','goalYears','inflation'].forEach(id=>$(id).addEventListener('input',inflationCalc));
function inflationCalc(){const goal=num($('goalToday').value),years=Math.max(1,num($('goalYears').value)),rate=num($('inflation').value)/100;const future=goal*Math.pow(1+rate,years);$('futureGoal').textContent=gbp(future);$('goalText').textContent=`At ${num($('inflation').value).toFixed(1)}% assumed inflation for ${years} year${years===1?'':'s'}. Planning estimate only.`}
$('demoBtn').onclick=()=>{state={income:2500,essential:1500,flexible:350,expenses:[{name:'Takeaway dinner',category:'Food',amount:22.50,essential:false},{name:'Streaming subscription',category:'Subscriptions',amount:12.99,essential:false},{name:'Coffee on the way to work',category:'Food',amount:4.20,essential:false},{name:'Fuel',category:'Transport',amount:65,essential:true},{name:'Impulse online purchase',category:'Shopping',amount:35,essential:false}],monthExpenses:[{name:'Unexpected car repair',category:'Transport',amount:90,essential:true},{name:'Dinner with friends',category:'Entertainment',amount:28,essential:false}],debts:[{name:'Credit card',balance:1800,min:55,apr:24.9},{name:'Personal loan',balance:4200,min:180,apr:8.9}],checkins:[{date:'12 Sep 2026',spend:8.5,note:'Skipped an impulse purchase and kept the money in the budget.'}],categories:[...defaultCategories,'Lifestyle']};save();render();location.hash='overview'};
$('resetBtn').onclick=()=>{if(confirm('Reset all MoneyCommons tracker data stored in this browser?')){state=structuredClone(defaults);save();render();closeExpenseForm();closeMonthForm()}};
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}
render();
