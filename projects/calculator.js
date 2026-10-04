(() => {
  const display = document.querySelector('#display');
  const status = document.querySelector('#calc-status');
  const keys = document.querySelector('#keys');
  let current = '0';
  let stored = null;
  let pendingOperator = null;
  let replaceCurrent = false;

  function render() {
    display.textContent = current;
  }

  function formatResult(value) {
    if (!Number.isFinite(value)) {
      status.textContent = 'That calculation is not defined. Start a new calculation.';
      status.dataset.kind = 'error';
      return null;
    }
    status.textContent = '';
    delete status.dataset.kind;
    return String(Number(value.toPrecision(10)));
  }

  function calculate(left, right, operator) {
    if (operator === '+') return left + right;
    if (operator === '−') return left - right;
    if (operator === '×') return left * right;
    if (operator === '÷') return right === 0 ? NaN : left / right;
    return right;
  }

  function chooseOperator(operator) {
    const value = Number(current);
    if (pendingOperator && !replaceCurrent) {
      const result = formatResult(calculate(stored, value, pendingOperator));
      if (result === null) return;
      current = result;
    } else {
      stored = value;
    }
    pendingOperator = operator;
    replaceCurrent = true;
    render();
  }

  function act(action, value) {
    if (action === 'digit') {
      current = replaceCurrent || current === '0' ? value : (current.length < 14 ? current + value : current);
      replaceCurrent = false;
      status.textContent = '';
      delete status.dataset.kind;
    } else if (action === 'operator') {
      chooseOperator(value);
    } else if (action === 'decimal') {
      if (replaceCurrent) current = '0';
      if (!current.includes('.')) current += '.';
      replaceCurrent = false;
    } else if (action === 'clear') {
      current = '0';
      stored = null;
      pendingOperator = null;
      replaceCurrent = false;
      status.textContent = '';
      delete status.dataset.kind;
    } else if (action === 'sign') {
      if (current !== '0') current = current.startsWith('-') ? current.slice(1) : `-${current}`;
    } else if (action === 'percent') {
      const result = formatResult(Number(current) / 100);
      if (result !== null) current = result;
    } else if (action === 'backspace') {
      if (!replaceCurrent) current = current.length > 1 ? current.slice(0, -1) : '0';
      if (current === '-') current = '0';
    } else if (action === 'equals' && pendingOperator) {
      const result = formatResult(calculate(stored, Number(current), pendingOperator));
      if (result !== null) current = result;
      stored = null;
      pendingOperator = null;
      replaceCurrent = true;
    }
    render();
  }

  keys.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.dataset.digit !== undefined) act('digit', button.dataset.digit);
    else if (button.dataset.operator) act('operator', button.dataset.operator);
    else if (button.dataset.action) act(button.dataset.action);
  });

  document.addEventListener('keydown', event => {
    if (/^\d$/.test(event.key)) act('digit', event.key);
    else if (event.key === '.') act('decimal');
    else if (event.key === 'Enter' || event.key === '=') { event.preventDefault(); act('equals'); }
    else if (event.key === 'Backspace') act('backspace');
    else if (event.key === 'Escape') act('clear');
    else if (event.key === '+') act('operator', '+');
    else if (event.key === '-') act('operator', '−');
    else if (event.key === '*') act('operator', '×');
    else if (event.key === '/') { event.preventDefault(); act('operator', '÷'); }
  });

  render();
})();
