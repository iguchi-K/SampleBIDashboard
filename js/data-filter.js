class DataFilter {
    constructor() {
        this.conditions = [];
        this.conditionCounter = 0;
        this.columns = [];
        this.originalData = [];
        this.filteredData = [];
    }

    setData(data) {
        this.originalData = data;
        this.filteredData = [...data];
        this.updateColumns();
    }

    updateColumns() {
        if (this.originalData.length > 0) {
            this.columns = this.originalData[0].map((header, index) => ({
                index: index,
                name: header,
                type: this.detectColumnType(index)
            }));
        }
    }

    detectColumnType(columnIndex) {
        if (this.originalData.length < 2) return 'text';
        
        const sampleValues = this.originalData.slice(1, 6).map(row => row[columnIndex]);
        const numericCount = sampleValues.filter(val => !isNaN(val) && val !== null && val !== '').length;
        
        return numericCount >= sampleValues.length * 0.7 ? 'number' : 'text';
    }

    getOperatorsForType(type) {
        if (type === 'number') {
            return [
                { value: 'eq', label: '=' },
                { value: 'ne', label: '≠' },
                { value: 'gt', label: '>' },
                { value: 'gte', label: '≥' },
                { value: 'lt', label: '<' },
                { value: 'lte', label: '≤' }
            ];
        } else {
            return [
                { value: 'contains', label: '含む' },
                { value: 'not_contains', label: '含まない' },
                { value: 'equals', label: '完全一致' },
                { value: 'not_equals', label: '一致しない' },
                { value: 'starts_with', label: 'で始まる' },
                { value: 'ends_with', label: 'で終わる' },
                { value: 'empty', label: '空' },
                { value: 'not_empty', label: '非空' }
            ];
        }
    }

    addCondition() {
        const conditionId = `condition_${this.conditionCounter++}`;
        const condition = {
            id: conditionId,
            column: 0,
            operator: 'contains',
            value: ''
        };
        
        this.conditions.push(condition);
        this.renderCondition(condition);
        return conditionId;
    }

    removeCondition(conditionId) {
        this.conditions = this.conditions.filter(c => c.id !== conditionId);
        const element = document.getElementById(conditionId);
        if (element) {
            element.remove();
        }
    }

    renderCondition(condition) {
        const container = document.getElementById('filter-conditions');
        const conditionDiv = document.createElement('div');
        conditionDiv.className = 'filter-condition';
        conditionDiv.id = condition.id;
        
        const columnSelect = this.createColumnSelect(condition);
        const operatorSelect = this.createOperatorSelect(condition);
        const valueInput = this.createValueInput(condition);
        const removeButton = this.createRemoveButton(condition);
        
        conditionDiv.appendChild(columnSelect);
        conditionDiv.appendChild(operatorSelect);
        conditionDiv.appendChild(valueInput);
        conditionDiv.appendChild(removeButton);
        
        container.appendChild(conditionDiv);
    }

    createColumnSelect(condition) {
        const select = document.createElement('select');
        this.columns.forEach(column => {
            const option = document.createElement('option');
            option.value = column.index;
            option.textContent = column.name;
            select.appendChild(option);
        });
        
        select.value = condition.column;
        select.addEventListener('change', (e) => {
            condition.column = parseInt(e.target.value);
            this.updateOperatorSelect(condition);
        });
        
        return select;
    }

    createOperatorSelect(condition) {
        const select = document.createElement('select');
        select.className = 'operator-select';
        
        const columnType = this.columns[condition.column]?.type || 'text';
        const operators = this.getOperatorsForType(columnType);
        
        operators.forEach(op => {
            const option = document.createElement('option');
            option.value = op.value;
            option.textContent = op.label;
            select.appendChild(option);
        });
        
        select.value = condition.operator;
        select.addEventListener('change', (e) => {
            condition.operator = e.target.value;
            this.updateValueInput(condition);
        });
        
        return select;
    }

    createValueInput(condition) {
        const input = document.createElement('input');
        input.className = 'value-input';
        input.type = 'text';
        input.placeholder = '値を入力';
        input.value = condition.value;
        
        const columnType = this.columns[condition.column]?.type || 'text';
        if (columnType === 'number') {
            input.type = 'number';
        }
        
        const needsValue = !['empty', 'not_empty'].includes(condition.operator);
        input.style.display = needsValue ? 'block' : 'none';
        
        input.addEventListener('input', (e) => {
            condition.value = e.target.value;
        });
        
        return input;
    }

    createRemoveButton(condition) {
        const button = document.createElement('button');
        button.className = 'remove-condition';
        button.textContent = '×';
        button.addEventListener('click', () => {
            this.removeCondition(condition.id);
        });
        return button;
    }

    updateOperatorSelect(condition) {
        const conditionDiv = document.getElementById(condition.id);
        const operatorSelect = conditionDiv.querySelector('.operator-select');
        const columnType = this.columns[condition.column]?.type || 'text';
        
        operatorSelect.innerHTML = '';
        const operators = this.getOperatorsForType(columnType);
        
        operators.forEach(op => {
            const option = document.createElement('option');
            option.value = op.value;
            option.textContent = op.label;
            operatorSelect.appendChild(option);
        });
        
        condition.operator = operators[0].value;
        this.updateValueInput(condition);
    }

    updateValueInput(condition) {
        const conditionDiv = document.getElementById(condition.id);
        const valueInput = conditionDiv.querySelector('.value-input');
        const columnType = this.columns[condition.column]?.type || 'text';
        
        if (columnType === 'number') {
            valueInput.type = 'number';
        } else {
            valueInput.type = 'text';
        }
        
        const needsValue = !['empty', 'not_empty'].includes(condition.operator);
        valueInput.style.display = needsValue ? 'block' : 'none';
        
        if (!needsValue) {
            condition.value = '';
        }
    }

    evaluateCondition(row, condition) {
        const cellValue = row[condition.column];
        const columnType = this.columns[condition.column]?.type || 'text';
        
        if (columnType === 'number') {
            const numValue = parseFloat(cellValue);
            const conditionValue = parseFloat(condition.value);
            
            if (isNaN(numValue) || isNaN(conditionValue)) return false;
            
            switch (condition.operator) {
                case 'eq': return numValue === conditionValue;
                case 'ne': return numValue !== conditionValue;
                case 'gt': return numValue > conditionValue;
                case 'gte': return numValue >= conditionValue;
                case 'lt': return numValue < conditionValue;
                case 'lte': return numValue <= conditionValue;
                default: return false;
            }
        } else {
            const strValue = String(cellValue || '').toLowerCase();
            const conditionValue = String(condition.value || '').toLowerCase();
            
            switch (condition.operator) {
                case 'contains': return strValue.includes(conditionValue);
                case 'not_contains': return !strValue.includes(conditionValue);
                case 'equals': return strValue === conditionValue;
                case 'not_equals': return strValue !== conditionValue;
                case 'starts_with': return strValue.startsWith(conditionValue);
                case 'ends_with': return strValue.endsWith(conditionValue);
                case 'empty': return strValue === '';
                case 'not_empty': return strValue !== '';
                default: return false;
            }
        }
    }

    applyFilter() {
        if (this.conditions.length === 0) {
            this.filteredData = [...this.originalData];
            return this.filteredData;
        }
        
        const logic = document.getElementById('filterLogic').value;
        const header = this.originalData[0];
        const dataRows = this.originalData.slice(1);
        
        const filteredRows = dataRows.filter(row => {
            if (logic === 'and') {
                return this.conditions.every(condition => this.evaluateCondition(row, condition));
            } else {
                return this.conditions.some(condition => this.evaluateCondition(row, condition));
            }
        });
        
        this.filteredData = [header, ...filteredRows];
        return this.filteredData;
    }

    applyLimit() {
        const limitType = document.getElementById('limitType').value;
        const limitCount = parseInt(document.getElementById('limitCount').value);
        const sortColumn = parseInt(document.getElementById('sortColumn').value);
        
        if (limitType === 'all') {
            return this.filteredData;
        }
        
        const header = this.filteredData[0];
        let dataRows = this.filteredData.slice(1);
        
        if (dataRows.length === 0) {
            return this.filteredData;
        }
        
        const columnType = this.columns[sortColumn]?.type || 'text';
        
        dataRows.sort((a, b) => {
            const aVal = a[sortColumn];
            const bVal = b[sortColumn];
            
            if (columnType === 'number') {
                const aNum = parseFloat(aVal);
                const bNum = parseFloat(bVal);
                return bNum - aNum;
            } else {
                const aStr = String(aVal || '');
                const bStr = String(bVal || '');
                return bStr.localeCompare(aStr);
            }
        });
        
        if (limitType === 'bottom') {
            dataRows.reverse();
        }
        
        const limitedRows = dataRows.slice(0, limitCount);
        return [header, ...limitedRows];
    }

    reset() {
        this.conditions = [];
        this.conditionCounter = 0;
        this.filteredData = [...this.originalData];
        
        const container = document.getElementById('filter-conditions');
        container.innerHTML = '';
        
        document.getElementById('filterLogic').value = 'and';
        document.getElementById('limitType').value = 'all';
        document.getElementById('limitCount').value = '10';
    }

    getFilteredData() {
        return this.filteredData;
    }
}