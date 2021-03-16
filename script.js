// https://www.taniarascia.com/javascript-mvc-todo-app/

class Model {

    constructor() {
        // The state of the model, an array of todo objects, pre-populated with some data
        // this.todos = [
        //     { id: 1, text: 'Run faster then chicken', complete: false },
        //     { id: 2, text: 'sexy time restaurant', complete: false }
        // ]

        //set the initial todo value to what's in local storage or an empty array
        this.todos = JSON.parse(localStorage.getItem('todos')) || []
    }

    _commit(todos) {
        this.onTodoListChange(todos)
        localStorage.setItem('todos', JSON.stringify(todos))
    }



    addTodo(todoText) {
        const todo = {
            id: this.todos.length > 0 ? this.todos[this.todos.length - 1].id + 1 : 1,
            text: todoText,
            complete: false
        }
        this.todos.push(todo)

        this.onTodoListChange(this.todos)
        this._commit(this.todos)
    }

    // Map through all todos, and replace the text of the todo with the specified id
    editTodo(id, updatedText) {
        this.todos = this.todos.map(todo =>
            todo.id === id ? { id: todo.id, text: updatedText, complete: todo.complete } : todo)

        this.onTodoListChange(this.todos)
        this._commit(this.todos)
    }

    // Filter a todo out of the array by id
    deleteTodo(id) {
        this.todos = this.todos.filter(todo => todo.id !== id)

        this.onTodoListChange(this.todos)
        this._commit(this.todos)
    }

    // Flip the complete boolean on the specified todo
    toggleTodo(id) {
        this.todos = this.todos.map(todo =>
            todo.id === id ? { id: todo.id, text: todo.text, complete: !todo.complete } : todo)

        this.onTodoListChange(this.todos)
        this._commit(this.todos)
    }

    bindTodoListChange(callback) {
        this.onTodoListChange = callback
    }
}

class View {
    constructor() {
        //the root element
        this.app = this.getElement('#root')

        // The title of the app
        this.title = this.createElement('h1')
        this.title.textContent = 'Todos'

        // The form, with a [type="text"] input, and a submit button
        this.form = this.createElement('form')

        this.input = this.createElement('input')
        this.input.type = 'text'
        this.input.placeholder = 'Add todo'
        this.input.name = 'todo'

        this.submitButton = this.createElement('button')
        this.submitButton.textContent = 'Submit'

        // The visual representation of the todo list
        this.todoList = this.createElement('ul', 'todo-list')

        // Append the input and submit button to the form
        this.form.append(this.input, this.submitButton)

        // Append the title, form, and todo list to the app
        this.app.append(this.title, this.form, this.todoList)

        //for span editing
        this._temporaryTodoText
        this._initLocalListeners()
    }

    // Create an element with an optional CSS class
    createElement(tag, className) {
        const element = document.createElement(tag)
        if (className) element.classList.add(className)
        return element
    }

    getElement(selector) {
        const element = document.querySelector(selector)
        return element
    }

    // the underscore to signify privacy
    get _todoText() { return this.input.value }

    _resetInput() { this.input.value = '' }

    displayTodos(todos) {
        // delete all nodes

        while (this.todoList.firstChild) {
            this.todoList.removeChild(this.todoList.firstChild)
        }

        // show default message
        if (todos.length === 0) {
            const p = this.createElement('p')
            p.textContent = 'Hey free person! Plan something to do?'
            this.todoList.append(p)
        } else {

            // Create todo item nodes for each todo in state
            todos.forEach(todo => {
                const li = this.createElement('li')
                li.id = todo.id

                // Each todo item will have a checkbox you can toggle
                const checkbox = this.createElement('input')
                checkbox.type = 'checkbox'
                checkbox.checked = todo.complete

                // The todo item text will be in a content editable span
                const span = this.createElement('span')
                span.contentEditable = true
                span.classList.add('editable')

                // If the todo is complete, it will have a strikethrough
                if (todo.complete) {
                    const strike = this.createElement('s')
                    strike.textContent = todo.text
                    span.append(strike)
                } else {
                    span.textContent = todo.text
                }

                //delete button
                const deleteButton = this.createElement('button', 'delete')
                deleteButton.textContent = 'Delete'

                //but everything together
                li.append(checkbox, span, deleteButton)

                //append nodes
                this.todoList.append(li)

            })
        }

    }

    //binders to controller, listeners
    bindAddTodo(handler) {
        this.form.addEventListener('submit', event => {
            event.preventDefault()

            if (this._todoText) {
                handler(this._todoText)
                this._resetInput()
            }
        })
    }

    bindDeleteTodo(handler) {
        this.todoList.addEventListener('click', event => {
            if (event.target.className === 'delete') {
                const id = +event.target.parentElement.id

                handler(id)
            }
        })
    }

    bindToggleTodo(handler) {
        this.todoList.addEventListener('click', event => {
            if (event.target.type === 'checkbox') {
                const id = +event.target.parentElement.id

                handler(id)
            }
        })
    }


    //update temporary state 
    _initLocalListeners() {
        this.todoList.addEventListener('input', event => {
            if (event.target.className === 'editable') {
                this._temporaryTodoText = event.target.innerText
                console.log(this._temporaryTodoText)
            }
        })
    }

    //Send the complete model to state
    bindEditTodo(handler) {
        this.todoList.addEventListener('focusout', event => {
            if (this._temporaryTodoText) {
                const id = +event.target.parentElement.id
                console.log(id)

                handler(id, this._temporaryTodoText)
                this._temporaryTodoText = ''
            }
        })
    }
}


class Controller {
    constructor(model, view) {



        // newly created object
        this.model = model
        this.view = view

        //Display initial todos
        this.onTodoListChange(this.model.todos)

        //bind
        this.view.bindAddTodo(this.handleAddTodo)
        this.view.bindDeleteTodo(this.handleDeleteTodo)
        this.view.bindToggleTodo(this.handleToggleTodo)
        this.view.bindEditTodo(this.handleEditTodo)

        this.model.bindTodoListChange(this.onTodoListChange)
    }


    onTodoListChange = todos => this.view.displayTodos(todos)

    handleAddTodo = todoText => this.model.addTodo(todoText)
    handleEditTodo = (id, todoText) => this.model.editTodo(id, todoText)
    handleDeleteTodo = id => this.model.deleteTodo(id)
    handleToggleTodo = id => this.model.toggleTodo(id)



}


// function lala() {
//     var name = "marats"


//     function changeName(name) {
//         name = name
//     }


//     return {
//         name: name
//         changeName: changeName

//     }

// }


const app = new Controller(new Model(), new View())
if (app) console.log('<--- The app is on --->')

// console.log(app.Controller.x)


// app.model.addTodo('Eat Cake')
// app.view.displayTodos(app.model.todos)

console.log(app.model.todos)
    // console.log(app.view.getElement.element)